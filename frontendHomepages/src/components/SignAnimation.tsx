import React from 'react';

interface SignAnimationProps {
  word: string;
  duration?: number;
  delay?: number;
  onComplete?: () => void;
}

const SignAnimation: React.FC<SignAnimationProps> = ({ 
  word, 
  duration = 1000, 
  delay = 100, 
  onComplete 
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, delay);

    return () => {
      clearTimeout(timer);
    setIsVisible(false);
      setCurrentIndex(0);
    onComplete?.();
    };
  }, [word, duration, delay, onComplete]);

  const letters = word.split('');
  const currentLetter = letters[currentIndex] || '';

  return (
    <div className="inline-flex items-center justify-center gap-1">
      {letters.map((letter, index) => (
        <span
          key={index}
          className={`
            transition-all duration-${duration}ms ease-in-out
            ${index === currentIndex ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}
            ${index < currentIndex ? 'translate-y-2' : 'translate-y-0'}
          `}
          style={{
            transitionDelay: `${index * delay}ms`
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
};

export default SignAnimation;
