import React, { useState, useEffect } from 'react';

interface LiveCountdownProps {
  endTime: number;
  isActive: boolean;
  className?: string;
}

export const LiveCountdown: React.FC<LiveCountdownProps> = ({ 
  endTime, 
  isActive, 
  className = "" 
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now() / 1000;
      const remaining = endTime - now;

      if (remaining <= 0 || !isActive) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = Math.floor(remaining % 60);

      return { days, hours, minutes, seconds, isExpired: false };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, isActive]);

  if (timeLeft.isExpired) {
    return (
      <div className={`text-red-400 font-mono font-semibold ${className}`}>
        EXPIRED
      </div>
    );
  }

  // Format display based on time remaining
  const formatDisplay = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }
  };

  // Color coding based on urgency
  const getUrgencyColor = () => {
    const totalSeconds = timeLeft.days * 86400 + timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
    
    if (totalSeconds < 300) { // Less than 5 minutes
      return 'text-red-400 animate-pulse';
    } else if (totalSeconds < 3600) { // Less than 1 hour
      return 'text-orange-400';
    } else if (totalSeconds < 86400) { // Less than 1 day
      return 'text-yellow-400';
    } else {
      return 'text-emerald-400';
    }
  };

  return (
    <div className={`font-mono font-semibold ${getUrgencyColor()} ${className}`}>
      {formatDisplay()}
    </div>
  );
};