import { useEffect, useState, useRef, useCallback } from "react";

type CountdownOptions = {
  duration: number;            // total time in seconds
  onComplete?: () => void;     // callback when countdown finishes
  onReset?: () => void;        // callback when timer is reset
  onPause?: () => void;        // callback when timer is paused
  autoStart?: boolean;         // whether to start timer automatically
};

export function useCountdown({ 
  duration, 
  onComplete, 
  onReset, 
  onPause,
  autoStart = true 
}: CountdownOptions) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const completedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout>(undefined);

  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsPaused(true);
      onPause?.();
    }
  }, [onPause]);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeLeft(duration);
    setIsActive(false);
    setIsPaused(false);
    completedRef.current = false;
    onReset?.();
  }, [duration, onReset]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return;
    }

    if (!isActive || isPaused) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(intervalRef.current);
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLeft, onComplete, isActive, isPaused]);

  return { 
    timeLeft, 
    reset, 
    start,
    pause, 
    resume, 
    isPaused,
    isActive 
  };
}
