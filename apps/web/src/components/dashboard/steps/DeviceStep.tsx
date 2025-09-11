'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { Bluetooth, Wifi, QrCode, Smartphone, Info, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card } from '@pommai/ui';
import { motion } from 'framer-motion';
import { useDeviceStore, type ConnectionType } from '@/stores/useDeviceStore';

export function DeviceStep() {
  const [pairingCode, setPairingCode] = useState('');
  const [activeTab, setActiveTab] = useState<ConnectionType>('bluetooth');
  
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
      await startPairing(activeTab);
    } catch (error) {
      console.error('Failed to start pairing:', error);
    }
  };

  const handlePairWithCode = () => {
    if (pairingCode.length === 6) {
      // In a real app, this would validate the code
      handleStartPairing();
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
          📱 Connect Your Device
        </h2>
        <p className="font-geo font-medium text-gray-700 tracking-wide">
          Pair your toy device to bring it to life. You can also skip this step and pair later.
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
              bg={activeTab === 'bluetooth' ? "#c381b5" : "#ffffff"}
              textColor={activeTab === 'bluetooth' ? "white" : "black"}
              borderColor="black"
              shadow={activeTab === 'bluetooth' ? "#8b5fa3" : "#e0e0e0"}
              onClick={() => setActiveTab('bluetooth')}
              className="flex-1 py-2 px-4 font-bold uppercase tracking-wider hover-lift text-sm"
            >
              <Bluetooth className="w-4 h-4 mr-2" />
              Bluetooth
            </Button>
            <Button
              bg={activeTab === 'wifi' ? "#c381b5" : "#ffffff"}
              textColor={activeTab === 'wifi' ? "white" : "black"}
              borderColor="black"
              shadow={activeTab === 'wifi' ? "#8b5fa3" : "#e0e0e0"}
              onClick={() => setActiveTab('wifi')}
              className="flex-1 py-2 px-4 font-bold uppercase tracking-wider hover-lift text-sm"
            >
              <Wifi className="w-4 h-4 mr-2" />
              WiFi
            </Button>
            <Button
              bg={activeTab === 'qr' ? "#c381b5" : "#ffffff"}
              textColor={activeTab === 'qr' ? "white" : "black"}
              borderColor="black"
              shadow={activeTab === 'qr' ? "#8b5fa3" : "#e0e0e0"}
              onClick={() => setActiveTab('qr')}
              className="flex-1 py-2 px-4 font-bold uppercase tracking-wider hover-lift text-sm"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'bluetooth' && (
            <div className="text-center py-8">
              <motion.div
                animate={isScanning ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: isScanning ? Infinity : 0 }}
                className="w-20 h-20 border-4 border-black bg-[#92cd41] mx-auto mb-4 flex items-center justify-center"
              >
                <Bluetooth className="w-10 h-10 text-white" />
              </motion.div>
              
              <h3 className="retro-h3 text-lg text-black mb-2">
                📡 Bluetooth Pairing
              </h3>
              <p className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-wide">
                Make sure your toy is powered on and in pairing mode
              </p>
              
              <Button
                bg={isScanning ? "#f0f0f0" : "#92cd41"}
                textColor={isScanning ? "#999" : "white"}
                borderColor="black"
                shadow={isScanning ? "#d0d0d0" : "#76a83a"}
                onClick={handleStartPairing}
                disabled={isScanning}
                className={`py-3 px-6 font-bold uppercase tracking-wider ${isScanning ? 'cursor-not-allowed' : 'hover-lift'}`}
              >
                {isScanning ? 'Scanning...' : pairingStep === 'connecting' ? 'Connecting...' : 'Scan for Devices'}
              </Button>

              {isScanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 space-y-2"
                >
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Looking for nearby devices...</p>
                  <div className="flex justify-center">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-[#c381b5] border border-black"></div>
                      <div className="w-2 h-2 bg-[#c381b5] border border-black"></div>
                      <div className="w-2 h-2 bg-[#c381b5] border border-black"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {pairingStep === 'connecting' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 space-y-2"
                >
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Connecting to device...</p>
                  <div className="flex justify-center">
                    <div className="animate-spin w-6 h-6 border-2 border-[#c381b5] border-t-transparent rounded-full"></div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'wifi' && (
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 border-4 border-black bg-[#f7931e] mx-auto mb-4 flex items-center justify-center">
                  <Wifi className="w-10 h-10 text-white" />
                </div>
                <h3 className="retro-h3 text-lg text-black mb-2">
                  📦 WiFi Connection
                </h3>
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Enter the 6-digit code shown on your toy&apos;s display
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-black uppercase tracking-wider text-black">Pairing Code</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="123456"
                      value={pairingCode}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setPairingCode(e.target.value.slice(0, 6))}
                      maxLength={6}
                      bg="#ffffff"
                      borderColor="black"
                      className="text-center text-lg font-black tracking-wider flex-1"
                    />
                    <Button
                      bg={pairingCode.length === 6 ? "#92cd41" : "#f0f0f0"}
                      textColor={pairingCode.length === 6 ? "white" : "#999"}
                      borderColor="black"
                      shadow={pairingCode.length === 6 ? "#76a83a" : "#d0d0d0"}
                      onClick={handlePairWithCode}
                      disabled={pairingCode.length !== 6 || isPairing}
                      className={`py-2 px-4 font-bold uppercase tracking-wider ${pairingCode.length === 6 && !isPairing ? 'hover-lift' : 'cursor-not-allowed'}`}
                    >
                      {isPairing ? 'Pairing...' : 'Connect'}
                    </Button>
                  </div>
                </div>

                <Card
                  bg="#fefcd0"
                  borderColor="black"
                  shadowColor="#c381b5"
                  className="p-4"
                >
                  <p className="text-sm font-black text-black mb-2 uppercase tracking-wider">📝 Instructions:</p>
                  <ol className="text-sm font-bold text-black space-y-1 list-decimal list-inside uppercase tracking-wide">
                    <li>Press the WiFi button on your toy</li>
                    <li>A 6-digit code will appear on the display</li>
                    <li>Enter the code above and click Connect</li>
                  </ol>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 border-4 border-black bg-[#c381b5] mx-auto mb-4 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="font-black text-lg uppercase tracking-wider text-black mb-2">
                📱 QR Code Pairing
              </h3>
              <p className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-wide">
                Use the companion mobile app to scan the QR code
              </p>
              
              {/* QR Code placeholder - in real app, would show actual QR code from pairingSession */}
              <div className="w-48 h-48 border-4 border-black bg-[#f0f0f0] mx-auto mb-6 flex items-center justify-center">
                {isPairing ? (
                  <div className="text-center">
                    <div className="animate-pulse text-[#c381b5] mb-2">
                      <QrCode className="w-24 h-24 mx-auto" />
                    </div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Generating...</p>
                  </div>
                ) : (
                  <span className="font-black text-gray-500 uppercase tracking-wider">QR Code</span>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
                  <Smartphone className="w-4 h-4" />
                  <span>📱 Open the Pomm.ai app to scan</span>
                </div>

                <Button
                  bg={isPairing ? "#f0f0f0" : "#c381b5"}
                  textColor={isPairing ? "#999" : "white"}
                  borderColor="black"
                  shadow={isPairing ? "#d0d0d0" : "#8b5fa3"}
                  onClick={() => !isPairing && handleStartPairing()}
                  disabled={isPairing}
                  className={`py-3 px-6 font-bold uppercase tracking-wider ${isPairing ? 'cursor-not-allowed' : 'hover-lift'}`}
                >
                  {isPairing ? 'Generating QR Code...' : 'Generate QR Code'}
                </Button>
              </div>
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
