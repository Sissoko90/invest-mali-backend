import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 100, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (canvasRef.current) {
        try {
          await QRCode.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        } catch (error) {
          console.error('Erreur génération QR Code:', error);
        }
      }
    };

    generateQRCode();
  }, [value, size]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ width: size, height: size }}
    />
  );
};

export default QRCodeGenerator;
























