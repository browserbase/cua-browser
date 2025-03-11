"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SessionControlsProps {
  sessionTime: number;
  onStop: () => void;
}

const formatTime = (seconds: number, totalTime: string): string => {
  // Always show minutes:seconds format
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")} / ${totalTime}`;
};

export const SessionControls: React.FC<SessionControlsProps> = ({
  sessionTime,
  onStop,
}) => {
  // Use client-side rendering for the time display to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-row items-center gap-2 bg-[#F6F5F5] px-2 py-1 border border-[#CAC8C7]">
      <div className="flex flex-row items-center gap-1">
        <svg
          className="w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <div className="flex items-center px-1 py-1 text-sm text-[#2E191E]">
          <span className="font-medium">Session time:</span>{" "}
          <span className="ml-1 min-w-[80px] text-center">
            {mounted ? formatTime(sessionTime, "5:00") : "0:00"}
          </span>
        </div>
      </div>

      <motion.button
        className="flex items-center justify-center px-2 py-0.5 text-sm text-white bg-[#FF3B00] hover:bg-[#E63500] transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStop}
      >
        <svg
          className="w-4 h-4 mr-1"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" />
        </svg>
        Stop
      </motion.button>
    </div>
  );
};
