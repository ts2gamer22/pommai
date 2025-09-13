'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { Wifi, Terminal, Download, Info, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button, Input, Card } from '@pommai/ui';
import { motion } from 'framer-motion';
import { useDeviceStore, type ConnectionType } from '@/stores/useDeviceStore';

export function DeviceStep() {
  const [deviceName, setDeviceName] = useState('');
  const [activeTab, setActiveTab] = useState<'wifi' | 'manual'>('wifi');
  
  const {
    isPairing,
    pairingStep,
    selectedDevice,
    error,
    startPairing,
    stopPairing,
    connectedDevices
  } = useDeviceStore();

  const isPaired = selectedDevice?.status === 'connected';
  const isScanning = isPairing && pairingStep === 'scanning';

  const handleStartPairing = async () => {
    try {
      await startPairing('wifi');
    } catch (error) {
      console.error('Failed to start pairing:', error);
    }
  };

  const handleSaveDeviceName = () => {
    if (deviceName.trim()) {
      // Save device name for later pairing
      console.log('Device name saved:', deviceName);
    }
  };

  // Clean up pairing session when component unmounts
  useEffect(() => {
    return () => {
      if (isPairing) {
        stopPairing();
      }
    };
  }, [isPairing, stopPairing]);

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="font-minecraft text-base sm:text-lg lg:text-xl font-black mb-2 uppercase tracking-wider text-gray-800"
          style={{
            textShadow: '2px 2px 0 #c381b5'
          }}
        >
          🔌 Connect Your Raspberry Pi
        </h2>
        <p className="font-geo font-medium text-gray-700 tracking-wide">
          Set up your Raspberry Pi Zero 2W with the Pommai OS. You can skip this and set up later.
        </p>
      </div>

      <Card
        bg="#f7931e"
        borderColor="black"
        shadowColor="#d67c1a"
        className="p-4"
      >
        <p className="text-sm font-bold text-white flex items-start gap-2 uppercase tracking-wide">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            📝 Device pairing is optional. You can complete the toy creation now and pair your physical device later from the dashboard.
          </span>
        </p>
      </Card>

      {/* Display error if any */}
      {error && (
        <Card
          bg="#ffdddd"
          borderColor="red"
          shadowColor="#ff6b6b"
          className="p-4"
        >
          <p className="text-red-700 text-sm font-bold uppercase tracking-wide">
            ERROR: {error}
          </p>
        </Card>
      )}

      {/* Show connected devices */}
      {connectedDevices().length > 0 && !isPaired && (
        <Card
          bg="#e6f7ff"
          borderColor="blue"
          shadowColor="#91d5ff"
          className="p-4"
        >
          <p className="text-blue-700 text-sm font-bold uppercase tracking-wide">
            📱 Found {connectedDevices().length} connected device(s). Select one to assign to your toy.
          </p>
        </Card>
      )}

      {isPaired ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 border-4 border-black bg-[#92cd41] mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="retro-h3 text-xl text-black mb-2">
            🎉 Device Paired Successfully!
          </h3>
          <p className="font-bold text-gray-700 uppercase tracking-wide mb-4">
            {selectedDevice?.name || 'Your device'} is now connected and ready to interact.
          </p>
          {selectedDevice && (
            <Card
              bg="#fefcd0"
              borderColor="black"
              shadowColor="#c381b5"
              className="p-4 max-w-sm mx-auto"
            >
              <div className="space-y-2 text-left">
                <p className="text-sm font-bold text-black">
                  <strong className="uppercase tracking-wider">📱 Device:</strong> {selectedDevice.name}
                </p>
                <p className="text-sm font-bold text-black">
                  <strong className="uppercase tracking-wider">💵 Battery:</strong> {selectedDevice.batteryLevel || 'N/A'}%
                </p>
                <p className="text-sm font-bold text-black">
                  <strong className="uppercase tracking-wider">📶 Signal:</strong> {selectedDevice.signalStrength || 'N/A'} dBm
                </p>
              </div>
            </Card>
          )}
        </motion.div>
      ) : (
        <Card
          bg="#ffffff"
          borderColor="black"
          shadowColor="#c381b5"
          className="p-4 sm:p-6"
        >
          {/* Tab Headers */}
          <div className="flex gap-2 mb-6">
            <Button
              bg={activeTab === 'wifi' ? "#c381b5" : "#ffffff"}
              textColor={activeTab === 'wifi' ? "white" : "black"}
              borderColor="black"
              shadow={activeTab === 'wifi' ? "#8b5fa3" : "#e0e0e0"}
              onClick={() => setActiveTab('wifi')}
              className="flex-1 py-2 px-4 font-bold uppercase tracking-wider hover-lift text-sm"
            >
              <Wifi className="w-4 h-4 mr-2" />
              WiFi Setup
            </Button>
            <Button
              bg={activeTab === 'manual' ? "#c381b5" : "#ffffff"}
              textColor={activeTab === 'manual' ? "white" : "black"}
              borderColor="black"
              shadow={activeTab === 'manual' ? "#8b5fa3" : "#e0e0e0"}
              onClick={() => setActiveTab('manual')}
              className="flex-1 py-2 px-4 font-bold uppercase tracking-wider hover-lift text-sm"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Manual Setup
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'wifi' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 border-4 border-black bg-[#f7931e] mx-auto mb-4 flex items-center justify-center">
                  <Wifi className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-minecraft text-lg text-black mb-2 uppercase tracking-wider">
                  📡 WiFi Access Point Setup
                </h3>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Connect your Raspberry Pi to your home WiFi
                </p>
              </div>

              <div className="space-y-4">
                {/* Step-by-step instructions */}
                <Card
                  bg="#92cd41"
                  borderColor="black"
                  shadowColor="#76a83a"
                  className="p-4"
                >
                  <p className="text-sm font-black text-white mb-3 uppercase tracking-wider">🚀 Quick Setup Steps:</p>
                  <ol className="text-sm font-bold text-white space-y-2 list-decimal list-inside">
                    <li>Download the Pommai OS image for Raspberry Pi</li>
                    <li>Flash it to your SD card using Raspberry Pi Imager</li>
                    <li>Insert SD card and power on your Pi</li>
                    <li>The Pi will create a WiFi network: "Pommai-Toy-Setup"</li>
                    <li>Connect to this network from your phone/computer</li>
                    <li>A setup page will open automatically</li>
                    <li>Select your home WiFi and enter password</li>
                    <li>Your toy will connect and be ready!</li>
                  </ol>
                </Card>

                <div className="space-y-3">
                  <Button
                    bg="#c381b5"
                    textColor="white"
                    borderColor="black"
                    shadow="#8b5fa3"
                    onClick={() => window.open('/downloads/pommai-os.img', '_blank')}
                    className="w-full py-3 px-6 font-minecraft font-black uppercase tracking-wider hover-lift flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Pommai OS
                  </Button>
                  
                  <Button
                    bg="#ffffff"
                    textColor="black"
                    borderColor="black"
                    shadow="#e0e0e0"
                    onClick={() => window.open('https://www.raspberrypi.com/software/', '_blank')}
                    className="w-full py-3 px-6 font-minecraft font-black uppercase tracking-wider hover-lift flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Get Raspberry Pi Imager
                  </Button>
                </div>

                <Card
                  bg="#fefcd0"
                  borderColor="black"
                  shadowColor="#c381b5"
                  className="p-4"
                >
                  <p className="text-xs font-geo text-gray-700">
                    <strong>💡 Note:</strong> After setup, your Pi will automatically connect to the Pommai cloud and FastRTC server for real-time voice interactions.
                  </p>
                </Card>

                <div className="space-y-2">
                  <label className="block text-sm font-black uppercase tracking-wider text-black">Device Name (Optional)</label>
                  <Input
                    type="text"
                    placeholder="Living Room Toy"
                    value={deviceName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setDeviceName(e.target.value)}
                    bg="#ffffff"
                    borderColor="black"
                    className="font-geo font-medium"
                  />
                  <p className="text-xs font-geo text-gray-600">Give your device a friendly name to identify it later</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 border-4 border-black bg-[#92cd41] mx-auto mb-4 flex items-center justify-center">
                  <Terminal className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-minecraft text-lg text-black mb-2 uppercase tracking-wider">
                  🔧 Manual Setup
                </h3>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  For advanced users who want to configure manually
                </p>
              </div>

              <Card
                bg="#ffffff"
                borderColor="black"
                shadowColor="#c381b5"
                className="p-4"
              >
                <p className="text-sm font-black text-black mb-3 uppercase tracking-wider">💻 SSH Setup:</p>
                <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                  <p># 1. SSH into your Raspberry Pi</p>
                  <p>$ ssh pi@raspberrypi.local</p>
                  <p className="text-gray-500"># Default password: raspberry</p>
                  <p className="mt-2"># 2. Clone the Pommai repository</p>
                  <p>$ git clone https://github.com/yourusername/pommai-pi.git</p>
                  <p className="mt-2"># 3. Run the setup script</p>
                  <p>$ cd pommai-pi && ./setup.sh</p>
                  <p className="mt-2"># 4. Configure WiFi</p>
                  <p>$ sudo raspi-config</p>
                </div>
              </Card>

              <Card
                bg="#ffe4e1"
                borderColor="red"
                shadowColor="#ff6b6b"
                className="p-4"
              >
                <p className="text-xs font-geo text-red-700">
                  <strong>⚠️ Warning:</strong> Manual setup requires Linux command line knowledge. We recommend using the WiFi Setup method for easier configuration.
                </p>
              </Card>

              <Card
                bg="#fefcd0"
                borderColor="black"
                shadowColor="#c381b5"
                className="p-4"
              >
                <p className="text-sm font-black text-black mb-2 uppercase tracking-wider">📦 Required Hardware:</p>
                <ul className="text-sm font-geo text-gray-700 space-y-1 list-disc list-inside">
                  <li>Raspberry Pi Zero 2W</li>
                  <li>ReSpeaker 2-Mics Pi HAT</li>
                  <li>MicroSD card (8GB minimum)</li>
                  <li>5V power supply</li>
                  <li>Optional: Speaker for audio output</li>
                </ul>
              </Card>

              <Button
                bg="#ffffff"
                textColor="black"
                borderColor="black"
                shadow="#e0e0e0"
                onClick={() => window.open('https://github.com/yourusername/pommai-pi/blob/main/README.md', '_blank')}
                className="w-full py-3 px-6 font-minecraft font-black uppercase tracking-wider hover-lift flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Full Documentation
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center justify-center">
        <Button
          bg="#ffffff"
          textColor="black"
          borderColor="black"
          shadow="#e0e0e0"
          className="py-2 px-4 font-bold uppercase tracking-wider hover-lift"
        >
          ⏭️ Skip for Now
        </Button>
      </div>
    </div>
  );
}
