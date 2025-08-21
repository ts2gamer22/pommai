'use client';

import { useState } from 'react';
import { Bluetooth, Wifi, QrCode, Smartphone, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/Tabs';
import { motion } from 'framer-motion';

export function DeviceStep() {
  const [pairingCode, setPairingCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isPaired, setIsPaired] = useState(false);

  const handleBluetoothScan = () => {
    setIsScanning(true);
    // Simulate scanning
    setTimeout(() => {
      setIsScanning(false);
    }, 3000);
  };

  const handlePairWithCode = () => {
    if (pairingCode.length === 6) {
      setIsPaired(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connect Your Device
        </h2>
        <p className="text-gray-600">
          Pair your toy device to bring it to life. You can also skip this step and pair later.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Device pairing is optional. You can complete the toy creation now and pair your physical device later from the dashboard.
          </span>
        </p>
      </div>

      {isPaired ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Device Paired Successfully!
          </h3>
          <p className="text-gray-600">
            Your toy is now connected and ready to interact.
          </p>
        </motion.div>
      ) : (
        <Tabs defaultValue="bluetooth" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bluetooth">Bluetooth</TabsTrigger>
            <TabsTrigger value="wifi">WiFi</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="bluetooth" className="space-y-4">
            <div className="text-center py-8">
              <motion.div
                animate={isScanning ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: isScanning ? Infinity : 0 }}
                className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center"
              >
                <Bluetooth className="w-10 h-10 text-blue-600" />
              </motion.div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Bluetooth Pairing
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Make sure your toy is powered on and in pairing mode
              </p>
              
              <Button
                onClick={handleBluetoothScan}
                disabled={isScanning}
                className="mx-auto"
              >
                {isScanning ? 'Scanning...' : 'Scan for Devices'}
              </Button>

              {isScanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 space-y-2"
                >
                  <p className="text-sm text-gray-500">Looking for nearby devices...</p>
                  <div className="flex justify-center">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="wifi" className="space-y-4">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Wifi className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  WiFi Connection
                </h3>
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code shown on your toy's display
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pairing-code">Pairing Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="pairing-code"
                    type="text"
                    placeholder="123456"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.slice(0, 6))}
                    maxLength={6}
                    className="text-center text-lg font-mono"
                  />
                  <Button
                    onClick={handlePairWithCode}
                    disabled={pairingCode.length !== 6}
                  >
                    Connect
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">Instructions:</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Press the WiFi button on your toy</li>
                  <li>A 6-digit code will appear on the display</li>
                  <li>Enter the code above and click Connect</li>
                </ol>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-green-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                QR Code Pairing
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Use the companion mobile app to scan the QR code
              </p>
              
              {/* QR Code placeholder */}
              <div className="w-48 h-48 bg-gray-200 rounded-lg mx-auto mb-6 flex items-center justify-center">
                <span className="text-gray-500">QR Code</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Smartphone className="w-4 h-4" />
                <span>Open the Pomm.ai app to scan</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <div className="flex items-center justify-center">
        <Button variant="outline" size="sm">
          Skip for Now
        </Button>
      </div>
    </div>
  );
}
