import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================
// useDebounce — tunda nilai selama `delay` ms
// ============================================================
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ============================================================
// useDebounceCallback — bungkus fungsi dengan debounce
// ============================================================
export function useDebounceCallback(callback, delay = 400) {
  const timerRef = useRef(null);

  const debouncedFn = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Bersihkan timer saat unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedFn;
}

// ============================================================
// useButtonGuard — cegah double-click pada tombol aksi
// Kembali [isLocked, trigger]
// ============================================================
export function useButtonGuard(delay = 1000) {
  const [isLocked, setIsLocked] = useState(false);
  const lockRef = useRef(false);

  const trigger = useCallback(
    (fn) => async (...args) => {
      if (lockRef.current) return;
      lockRef.current = true;
      setIsLocked(true);
      try {
        await fn(...args);
      } finally {
        setTimeout(() => {
          lockRef.current = false;
          setIsLocked(false);
        }, delay);
      }
    },
    [delay]
  );

  return [isLocked, trigger];
}
