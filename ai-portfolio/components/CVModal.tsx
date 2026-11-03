// components/CVModal.tsx
"use client";

import { useEffect } from "react";
import Image from "next/image";

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CVModal({ isOpen, onClose }: CVModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-slideUp">
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20">
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/20 bg-black/30">
            <h2 className="text-2xl font-bold text-white">
              📄 Murtaza Afzali - CV / Resume
            </h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors text-3xl leading-none hover:scale-110 transform transition"
            >
              ✕
            </button>
          </div>
          
          {/* CV Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* PDF Viewer */}
            <div className="bg-white rounded-lg p-2 mb-4">
              <iframe
                src="/Murtaza_Afzali.pdf#toolbar=0"
                className="w-full h-[600px] rounded-lg"
                title="CV Preview"
              />
            </div>
            
            {/* Download Button Inside Modal */}
            <div className="flex justify-center gap-4 mt-4">
              <a
                href="/Murtaza_Afzali.pdf"
                download="Murtaza_Afzali_CV.pdf"
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg hover:shadow-xl"
              >
                💾 Download CV (PDF)
              </a>
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 hover:scale-105 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </>
  );
}