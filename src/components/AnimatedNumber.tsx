import { useEffect, useRef, useState } from "react";

// Counts from the previous value to the new one — a premium "live data" feel.
export default function AnimatedNumber({ value, format, duration = 600 }: { value: number; format: (v: number) => string; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const raf = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const b = value;
    if (a === b) return;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(a + (b - a) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = b;
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <>{format(display)}</>;
}
