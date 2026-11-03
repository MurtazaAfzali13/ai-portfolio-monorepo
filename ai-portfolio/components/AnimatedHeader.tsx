// components/AnimatedHeader.tsx
"use client";

import { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";

interface AnimatedHeaderProps {
  onClose?: () => void;
}

export default function AnimatedHeader({ onClose }: AnimatedHeaderProps) {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  
  const fullName = "MURTAZA AFZALI";
  const staticText = "ASK ABOUT";
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (!isDeleting && !isTypingComplete) {
      // Typing phase
      if (displayText.length < fullName.length) {
        timeout = setTimeout(() => {
          setDisplayText(fullName.slice(0, displayText.length + 1));
        }, 100);
      } else {
        // Typing complete, wait 2 seconds then start deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
      }
    } else if (isDeleting) {
      // Deleting phase
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 80);
      } else {
        // Reset and start over
        setIsDeleting(false);
        setIsTypingComplete(false);
      }
    }
    
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, isTypingComplete, fullName]);
  
  return (
    <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-400 animate-pulse" />
        <span className="flex items-baseline gap-2">
          <span className="text-blue-400">{staticText}</span>
          <div className="relative">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {displayText}
            </span>
            {/* Blinking cursor */}
            <span className="inline-block w-0.5 h-5 bg-blue-400 ml-0.5 animate-blink"></span>
          </div>
        </span>
      </h2>
      
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
          aria-label="Close chat"
        >
          <X className="w-5 h-5 text-gray-400 group-hover:text-white transition" />
        </button>
      )}
      
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
}