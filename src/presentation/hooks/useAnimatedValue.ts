import { useRef, useState, useEffect } from 'react';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useAnimatedValue(target: number, duration = 600): number {
  const prevTargetRef = useRef(target);
  const startTimeRef = useRef(0);
  const startValueRef = useRef(0);
  const rafRef = useRef(0);
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    if (target === prevTargetRef.current) return;

    startValueRef.current = current;
    prevTargetRef.current = target;
    startTimeRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const next = startValueRef.current + (target - startValueRef.current) * eased;
      setCurrent(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}
