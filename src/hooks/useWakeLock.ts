import { useRef, useCallback, useEffect } from 'react';

export const useWakeLock = () => {
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active');
        
        wakeLock.current.addEventListener('release', () => {
          console.log('Wake Lock was released');
        });
      } catch (err) {
        console.error(`${(err as Error).name}, ${(err as Error).message}`);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock.current) {
      await wakeLock.current.release();
      wakeLock.current = null;
    }
  }, []);

  // Re-request wake lock when visibility changes (e.g., switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (wakeLock.current !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock]);

  return { requestWakeLock, releaseWakeLock };
};
