import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

const SignatureCanvas = ({ onSignatureChange, disabled = false }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Set drawing style
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getEventPosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDrawing(true);
    const position = getEventPosition(e);
    setLastPosition(position);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const position = getEventPosition(e);
    
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(position.x, position.y);
    ctx.stroke();
    
    setLastPosition(position);
    
    if (!hasSignature) {
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    // Convert canvas to base64 and notify parent
    if (hasSignature) {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL('image/png');
      onSignatureChange?.(signatureData);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasSignature(false);
    onSignatureChange?.(null);
  };


  return (
    <div className="signature-canvas-container">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <PenTool className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Please sign below
          </span>
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`border-2 border-gray-200 rounded bg-white cursor-crosshair touch-none w-full h-32 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
          
          {!hasSignature && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-gray-400 text-sm italic">
                Click and drag to sign
              </span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <button
            type="button"
            onClick={clearSignature}
            disabled={!hasSignature || disabled}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
          
          <div className="flex items-center gap-1 text-sm">
            {hasSignature ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Signature added</span>
              </>
            ) : (
              <span className="text-gray-500">No signature</span>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        By signing above, I acknowledge that I have read and agree to the terms of this Letter of Engagement.
      </p>
    </div>
  );
};

export default SignatureCanvas;