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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;

    let mounted = true;

    const initScanner = async () => {
      try {
        if (scannerRef.current) {
          await scannerRef.current.clear();
          scannerRef.current = null;
        }

        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: { ideal: 'environment' }
            },
            rememberLastUsedCamera: true
          },
          false
        );

        if (!mounted) return;

        scanner.render(
          (decodedText) => {
            console.log('=== QR ESCANEADO ===');
            console.log('Código leído:', decodedText);
            console.log('Tipo:', typeof decodedText);
            console.log('Longitud:', decodedText.length);
            console.log('====================');
            if (mounted) {
              onScan(decodedText);
              handleClose();
            }
          },
          (errorMessage) => {
            console.log('Scanner error:', errorMessage);
          }
        );

        scannerRef.current = scanner;
        setIsScanning(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing scanner:', err);
        setError('Error al inicializar la cámara');
        if (onError) {
          onError(err instanceof Error ? err.message : 'Error desconocido');
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      setIsScanning(false);
    };
  }, [isActive]);

  const handleClose = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error clearing scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setError(null);
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
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-center">
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs text-red-500 mt-1">Verifica los permisos de cámara</p>
            </div>
          )}
          {isScanning && !error && (
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