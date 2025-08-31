import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DeviceStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type ConnectionType = 'bluetooth' | 'wifi' | 'qr';

export interface Device {
  id: string;
  name: string;
  type: string; // 'raspberry-pi', 'arduino', etc.
  status: DeviceStatus;
  lastSeen?: Date;
  toyId?: string; // Currently assigned toy
  ipAddress?: string;
  bluetoothAddress?: string;
  firmwareVersion?: string;
  batteryLevel?: number;
  signalStrength?: number;
}

export interface PairingSession {
  id: string;
  type: ConnectionType;
  deviceId?: string;
  qrCode?: string;
  isActive: boolean;
  expiresAt: Date;
}

interface DeviceState {
  // Data
  devices: Device[];
  selectedDevice: Device | null;
  isScanning: boolean;
  error: string | null;
  
  // Pairing
  pairingSession: PairingSession | null;
  isPairing: boolean;
  pairingStep: 'method' | 'scanning' | 'connecting' | 'success' | 'error';
  
  // Actions
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => void;
  removeDevice: (deviceId: string) => void;
  setSelectedDevice: (device: Device | null) => void;
  setScanning: (scanning: boolean) => void;
  setError: (error: string | null) => void;
  
  // Pairing actions
  startPairing: (type: ConnectionType) => Promise<void>;
  stopPairing: () => void;
  setPairingStep: (step: DeviceState['pairingStep']) => void;
  
  // Device management
  connectDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<void>;
  assignToyToDevice: (deviceId: string, toyId: string) => Promise<void>;
  unassignToyFromDevice: (deviceId: string) => Promise<void>;
  
  // Computed
  connectedDevices: () => Device[];
  availableDevices: () => Device[];
  devicesByToy: () => Record<string, Device>;
  
  reset: () => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      // Initial state
      devices: [],
      selectedDevice: null,
      isScanning: false,
      error: null,
      
      // Pairing state
      pairingSession: null,
      isPairing: false,
      pairingStep: 'method',
      
      // Data actions
      setDevices: (devices) => set({ devices, error: null }),
      
      addDevice: (device) => set((state) => ({
        devices: [...state.devices.filter(d => d.id !== device.id), device]
      })),
      
      updateDevice: (deviceId, updates) => set((state) => ({
        devices: state.devices.map(device => 
          device.id === deviceId 
            ? { ...device, ...updates, lastSeen: new Date() } 
            : device
        ),
        selectedDevice: state.selectedDevice?.id === deviceId
          ? { ...state.selectedDevice, ...updates }
          : state.selectedDevice
      })),
      
      removeDevice: (deviceId) => set((state) => ({
        devices: state.devices.filter(device => device.id !== deviceId),
        selectedDevice: state.selectedDevice?.id === deviceId 
          ? null 
          : state.selectedDevice
      })),
      
      setSelectedDevice: (selectedDevice) => set({ selectedDevice }),
      setScanning: (isScanning) => set({ isScanning }),
      setError: (error) => set({ error }),
      
      // Pairing actions
      startPairing: async (type: ConnectionType) => {
        set({ 
          isPairing: true, 
          pairingStep: 'scanning',
          error: null,
          pairingSession: {
            id: `pair_${Date.now()}`,
            type,
            isActive: true,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
          }
        });
        
        try {
          // TODO: Implement actual pairing logic
          if (type === 'qr') {
            // Generate QR code for device setup
            set((state) => ({
              pairingSession: state.pairingSession ? {
                ...state.pairingSession,
                qrCode: `pommai://pair/${state.pairingSession.id}`
              } : null
            }));
          }
          
          // Simulate pairing process
          setTimeout(() => {
            set({ pairingStep: 'connecting' });
            
            setTimeout(() => {
              // Mock successful pairing
              const mockDevice: Device = {
                id: `device_${Date.now()}`,
                name: 'Raspberry Pi Zero 2W',
                type: 'raspberry-pi',
                status: 'connected',
                lastSeen: new Date(),
                firmwareVersion: '1.0.0',
                batteryLevel: 85,
                signalStrength: -45,
              };
              
              get().addDevice(mockDevice);
              set({ 
                pairingStep: 'success',
                selectedDevice: mockDevice,
                isPairing: false,
                pairingSession: null
              });
            }, 2000);
          }, 3000);
          
        } catch (error: any) {
          set({ 
            error: error.message || 'Pairing failed',
            pairingStep: 'error',
            isPairing: false
          });
        }
      },
      
      stopPairing: () => set({ 
        isPairing: false, 
        pairingSession: null,
        pairingStep: 'method'
      }),
      
      setPairingStep: (pairingStep) => set({ pairingStep }),
      
      // Device management
      connectDevice: async (deviceId: string) => {
        set({ error: null });
        try {
          get().updateDevice(deviceId, { status: 'connecting' });
          
          // TODO: Implement actual connection logic
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          get().updateDevice(deviceId, { status: 'connected' });
        } catch (error: any) {
          get().updateDevice(deviceId, { status: 'error' });
          set({ error: error.message || 'Failed to connect device' });
        }
      },
      
      disconnectDevice: async (deviceId: string) => {
        try {
          // TODO: Implement actual disconnection logic
          get().updateDevice(deviceId, { status: 'disconnected' });
        } catch (error: any) {
          set({ error: error.message || 'Failed to disconnect device' });
        }
      },
      
      assignToyToDevice: async (deviceId: string, toyId: string) => {
        try {
          // TODO: Send toy configuration to device
          get().updateDevice(deviceId, { toyId });
        } catch (error: any) {
          set({ error: error.message || 'Failed to assign toy to device' });
        }
      },
      
      unassignToyFromDevice: async (deviceId: string) => {
        try {
          get().updateDevice(deviceId, { toyId: undefined });
        } catch (error: any) {
          set({ error: error.message || 'Failed to unassign toy from device' });
        }
      },
      
      // Computed getters
      connectedDevices: () => 
        get().devices.filter(device => device.status === 'connected'),
      
      availableDevices: () => 
        get().devices.filter(device => 
          device.status === 'connected' || device.status === 'disconnected'
        ),
      
      devicesByToy: () => {
        const devices = get().devices;
        const result: Record<string, Device> = {};
        devices.forEach(device => {
          if (device.toyId) {
            result[device.toyId] = device;
          }
        });
        return result;
      },
      
      reset: () => set({
        devices: [],
        selectedDevice: null,
        isScanning: false,
        error: null,
        pairingSession: null,
        isPairing: false,
        pairingStep: 'method',
      }),
    }),
    {
      name: 'pommai-device-store',
      partialize: (state) => ({
        devices: state.devices,
      }),
    }
  )
);