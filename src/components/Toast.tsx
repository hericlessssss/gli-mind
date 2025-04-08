import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  show: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 
        ${type === 'success' 
          ? 'bg-green-900/90 border-green-700' 
          : 'bg-red-900/90 border-red-700'} 
        border rounded-lg shadow-lg transition-all duration-300 
        ${show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
    >
      <div className="flex items-center gap-3 p-4 pr-12">
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400" />
        )}
        <p className="text-white font-medium">{message}</p>
        <button
          onClick={onClose}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};