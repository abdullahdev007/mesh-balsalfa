import React, { useEffect, useState, useRef } from 'react';
import styles from './styles.module.scss';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  isArabic?: boolean;
  onComplete?: () => void;
  skipAnimation?: boolean;
  className?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  isArabic = false,
  onComplete,
  skipAnimation = false,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  const previousText = useRef(text);

  useEffect(() => {
    // If skipAnimation is true or text has changed and it's a timer update
    if (skipAnimation || (text !== previousText.current && text.includes('ثانية'))) {
      setDisplayedText(text);
      setIndex(text.length);
      if (onComplete) onComplete();
      previousText.current = text;
      return;
    }

    // If text has changed, reset the animation
    if (text !== previousText.current) {
      setDisplayedText('');
      setIndex(0);
      previousText.current = text;
      return;
    }

    // Normal typewriter animation
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete, skipAnimation]);

  return (
    <div
      className={`${styles.typewriterContainer} ${isArabic ? styles.arabic : ''} ${className}`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <p className={styles.typewriterText}>{displayedText}</p>
    </div>
  );
};

export default TypewriterText;