import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, Search } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isActive: boolean;
  onClose: () => void;
}

export default function QRScanner({ onScan, onError, isActive, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isActive && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          setIsScanning(false);
          scanner.clear();
          scannerRef.current = null;
        },
        (error) => {
          if (onError) {
            onError(error);
          }
        }
      );

      scannerRef.current = scanner;
      setIsScanning(true);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      }
    };
  }, [isActive, onScan, onError]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
      setIsScanning(false);
    }
    onClose();
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear Código
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div id="qr-reader" className="w-full"></div>
          {isScanning && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Apunta la cámara hacia el código QR o de barras
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}