/**
 * WebRTC Client for connecting to FastRTC Gateway
 * Handles real-time audio streaming for AI toy interactions
 */

import { EventEmitter } from 'events';

export interface WebRTCClientConfig {
  gatewayUrl: string;
  deviceId: string;
  toyId: string;
  userId?: string;
  iceServers?: RTCIceServer[];
}

export interface SessionInfo {
  sessionId: string;
  threadId: string;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class WebRTCClient extends EventEmitter {
  private config: WebRTCClientConfig;
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private sessionInfo: SessionInfo | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private isConnected = false;
  private audioContext: AudioContext | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;

  constructor(config: WebRTCClientConfig) {
    super();
    this.config = {
      ...config,
      iceServers: config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
  }

  /**
   * Initialize connection to FastRTC Gateway
   */
  async connect(): Promise<void> {
    try {
      // Create session with gateway
      const sessionResponse = await fetch(`${this.config.gatewayUrl}/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: this.config.deviceId,
          toyId: this.config.toyId,
          userId: this.config.userId,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error(`Failed to create session: ${sessionResponse.statusText}`);
      }

      const sessionData = await sessionResponse.json();
      this.sessionInfo = {
        sessionId: sessionData.sessionId,
        threadId: sessionData.threadId,
      };

      // Setup WebRTC connection
      await this.setupPeerConnection();

      // Set remote description (offer from server)
      await this.pc!.setRemoteDescription(
        new RTCSessionDescription(sessionData.offer)
      );

      // Create answer
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);

      // Send answer to gateway
      const answerResponse = await fetch(`${this.config.gatewayUrl}/session/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionInfo.sessionId,
          answer: {
            sdp: answer.sdp,
            type: answer.type,
          },
        }),
      });

      if (!answerResponse.ok) {
        throw new Error(`Failed to send answer: ${answerResponse.statusText}`);
      }

      this.emit('connected', this.sessionInfo);
    } catch (error) {
      console.error('Connection failed:', error);
      this.emit('error', error);
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
      }
    }
  }

  /**
   * Setup WebRTC peer connection
   */
  private async setupPeerConnection(): Promise<void> {
    // Create peer connection
    this.pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate);
      }
    };

    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc?.connectionState);
      
      switch (this.pc?.connectionState) {
        case 'connected':
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connectionStateChange', 'connected');
          break;
        case 'disconnected':
          this.isConnected = false;
          this.emit('connectionStateChange', 'disconnected');
          break;
        case 'failed':
          this.isConnected = false;
          this.emit('connectionStateChange', 'failed');
          this.reconnect();
          break;
        case 'closed':
          this.isConnected = false;
          this.emit('connectionStateChange', 'closed');
          break;
      }
    };

    // Handle incoming tracks (audio from server)
    this.pc.ontrack = (event) => {
      console.log('Received track:', event.track.kind);
      
      if (event.track.kind === 'audio') {
        // Create or update remote stream
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        this.remoteStream.addTrack(event.track);
        
        // Emit event for UI to handle
        this.emit('remoteAudio', this.remoteStream);
      }
    };

    // Create data channel for control messages
    this.dataChannel = this.pc.createDataChannel('control', {
      ordered: true,
    });

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.emit('dataChannelOpen');
      
      // Send periodic heartbeat
      this.startHeartbeat();
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleControlMessage(message);
      } catch (error) {
        console.error('Failed to parse control message:', error);
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      this.emit('dataChannelError', error);
    };

    // Get user media and add to connection
    await this.setupLocalAudio();
  }

  /**
   * Setup local audio stream
   */
  private async setupLocalAudio(): Promise<void> {
    try {
      // Request microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
        video: false,
      });

      // Add audio track to peer connection
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack && this.pc) {
        this.pc.addTrack(audioTrack, this.localStream);
        this.emit('localAudio', this.localStream);
      }

      // Setup audio processing for voice activity detection
      this.setupAudioProcessing();
    } catch (error) {
      console.error('Failed to get user media:', error);
      this.emit('error', error);
    }
  }

  /**
   * Setup audio processing for VAD and visualization
   */
  private setupAudioProcessing(): void {
    if (!this.localStream) return;

    const Ctx = window.AudioContext || window.webkitAudioContext!;
    this.audioContext = new Ctx();
    const source = this.audioContext.createMediaStreamSource(this.localStream);
    
    // Create processor for audio analysis
    this.audioProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);
    
    this.audioProcessor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      
      // Calculate RMS for voice activity detection
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      
      // Emit audio level for UI visualization
      this.emit('audioLevel', rms);
      
      // Simple VAD
      const isSpeaking = rms > 0.01;
      this.emit('voiceActivity', isSpeaking);
    };

    source.connect(this.audioProcessor);
    this.audioProcessor.connect(this.audioContext.destination);
  }

  /**
   * Handle control messages from server
   */
  private handleControlMessage(message: { type: string; [key: string]: unknown }): void {
    switch (message.type) {
      case 'pong':
        // Heartbeat response
        break;
      case 'transcription':
        this.emit('transcription', message.text);
        break;
      case 'aiResponse':
        this.emit('aiResponse', message.text);
        break;
      case 'error':
        this.emit('serverError', message.error);
        break;
      default:
        console.log('Unknown control message:', message);
    }
  }

  /**
   * Send control message to server
   */
  public sendControlMessage(message: Record<string, unknown>): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    } else {
      console.warn('Data channel not open, cannot send message');
    }
  }

  /**
   * Start recording audio
   */
  public startRecording(): void {
    this.sendControlMessage({ command: 'start_recording' });
    this.emit('recordingStarted');
  }

  /**
   * Stop recording audio
   */
  public stopRecording(): void {
    this.sendControlMessage({ command: 'stop_recording' });
    this.emit('recordingStopped');
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    setInterval(() => {
      if (this.isConnected) {
        this.sendControlMessage({ command: 'ping' });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Reconnect to gateway
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.cleanup();
    this.reconnectAttempts++;
    
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
    
    setTimeout(() => {
      this.connect();
    }, 2000 * this.reconnectAttempts);
  }

  /**
   * Disconnect from gateway
   */
  public async disconnect(): Promise<void> {
    this.cleanup();
    this.emit('disconnected');
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Stop remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Disconnect audio processor
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.isConnected = false;
    this.sessionInfo = null;
  }

  /**
   * Get current session info
   */
  public getSessionInfo(): SessionInfo | null {
    return this.sessionInfo;
  }

  /**
   * Check if connected
   */
  public getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get local audio stream
   */
  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote audio stream
   */
  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Mute/unmute local audio
   */
  public setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
      this.emit('muteStateChanged', muted);
    }
  }

  /**
   * Get mute state
   */
  public getMuted(): boolean {
    if (this.localStream) {
      const track = this.localStream.getAudioTracks()[0];
      return track ? !track.enabled : true;
    }
    return true;
  }
}
