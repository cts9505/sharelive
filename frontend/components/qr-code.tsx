'use client';

import { useEffect, useRef, useState } from 'react';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCode({ url, size = 128, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current) return;
      
      try {
        // Dynamically import qrcode library
        const QRCodeLib = await import('qrcode');
        
        await QRCodeLib.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        setIsLoading(false);
      }
    };

    generateQR();
  }, [url, size]);

  const downloadQR = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${new URL(url).hostname}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg"
          style={{ width: size, height: size }}
        >
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
      />
      <button
        onClick={downloadQR}
        className="absolute -bottom-2 -right-2 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-opacity"
        title="Download QR Code"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
    </div>
  );
}

// Modal component to show QR code in full screen
interface QRCodeModalProps {
  url: string;
  subdomain: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ url, subdomain, isOpen, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const generateQR = async () => {
      try {
        const QRCodeLib = await import('qrcode');
        
        await QRCodeLib.toCanvas(canvasRef.current, url, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    };

    generateQR();
  }, [url, isOpen]);

  const downloadQR = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `${subdomain}-sharelive-qr.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl p-6 shadow-2xl max-w-sm w-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Scan QR Code</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Share your site instantly
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-4">
            <div className="p-4 bg-white rounded-xl shadow-inner">
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* URL Display */}
          <div className="px-3 py-2 bg-muted rounded-lg">
            <p className="text-sm font-mono text-foreground truncate">{url}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={downloadQR}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium text-sm hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
