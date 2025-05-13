import { useEffect, useState, useRef } from "react";

type CountdownOptions = {
  duration: number;            // total time in seconds
  onComplete?: () => void;     // callback when countdown finishes
};

export function useCountdown({ duration, onComplete }: CountdownOptions) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const completedRef = useRef(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) clearInterval(interval);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onComplete]);


  return { timeLeft };
}
