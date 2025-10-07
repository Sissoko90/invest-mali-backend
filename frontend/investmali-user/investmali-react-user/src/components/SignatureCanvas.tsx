import React, { useRef, useState, useEffect } from 'react';

interface SignatureCanvasProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  existingSignature?: string;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSignatureChange, existingSignature }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(existingSignature || null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Définir la taille du canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Fond blanc
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Si signature existante, la charger
    if (existingSignature && signatureMode === 'draw') {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = existingSignature;
    }
  }, [existingSignature, signatureMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        onSignatureChange(dataUrl);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onSignatureChange(null);
    setUploadedSignature(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La taille de l\'image ne doit pas dépasser 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedSignature(dataUrl);
      onSignatureChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Sélecteur de mode */}
      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => {
            setSignatureMode('draw');
            setUploadedSignature(null);
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            signatureMode === 'draw'
              ? 'bg-mali-emerald text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ✍️ Signer à la main
        </button>
        <button
          type="button"
          onClick={() => {
            setSignatureMode('upload');
            clearSignature();
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            signatureMode === 'upload'
              ? 'bg-mali-emerald text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📤 Uploader une signature
        </button>
      </div>

      {/* Zone de signature ou upload */}
      {signatureMode === 'draw' ? (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full cursor-crosshair touch-none"
              style={{ height: '200px' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearSignature}
              className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              🗑️ Effacer
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Signez dans la zone ci-dessus avec votre souris ou votre doigt
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white text-center">
            {uploadedSignature ? (
              <div className="space-y-4">
                <img
                  src={uploadedSignature}
                  alt="Signature uploadée"
                  className="max-h-48 mx-auto"
                />
                <button
                  type="button"
                  onClick={clearSignature}
                  className="py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  🗑️ Supprimer
                </button>
              </div>
            ) : (
              <div>
                <label className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-4xl">📤</div>
                    <div className="text-sm text-gray-600">
                      Cliquez pour uploader votre signature
                    </div>
                    <div className="text-xs text-gray-500">
                      PNG, JPG, JPEG (max 2MB)
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 text-center">
            Uploadez une image de votre signature (signature scannée ou photo)
          </p>
        </div>
      )}
    </div>
  );
};

export default SignatureCanvas;
