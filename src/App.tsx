import { useState, useEffect, useRef, useCallback } from 'react';
import { Target, AlertTriangle } from 'lucide-react';
import { useWakeLock } from './hooks/useWakeLock';

const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const playTTS = (text: string, onEnd?: () => void) => {
  if (!('speechSynthesis' in window)) {
    console.warn('TTS is not supported in this browser.');
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 1.0;
  utterance.pitch = 0.8;
  
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd; 
  }
  
  // Prevent Garbage Collection
  (window as any).__ttsUtterance = utterance;
  
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 10);
};

const stopTTS = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

type TimerStatus = 'STANDBY' | 'RUNNING_60' | 'INTERRUPT_SPEECH' | 'RUNNING_5';

const unlockAudioContext = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
};

export default function App() {
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('STANDBY');
  const [timeLeft, setTimeLeft] = useState(60);
  const [activeNarrator, setActiveNarrator] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);

  const narratorPhases = [
    { id: 1, label: '게임 시작', text: '게임을 시작합니다. 모두 눈을 감아주세요.' },
    { id: 2, label: '1R 종료', text: '일라운드가 종료되었습니다. 낮이 밝았습니다.' },
    { id: 3, label: '2R 종료', text: '이라운드가 종료되었습니다. 투표를 진행합니다.' },
    { id: 4, label: '3R 종료', text: '삼라운드가 종료되었습니다. 밀정의 시간이 다가옵니다.' },
    { id: 5, label: '4R 종료', text: '사라운드가 종료되었습니다. 생존자를 확인하세요.' },
    { id: 6, label: '5R 시작', text: '최종 오라운드를 시작합니다. 시스템 권한이 제한됩니다.' },
  ];

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
  }, []);

  const start5sCountdown = useCallback(() => {
    clearAllTimers();
    playTTS('5');
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const nextTime = prev - 1;
        if (nextTime <= 0) {
          clearAllTimers();
          setTimerStatus('STANDBY');
          setTimeLeft(60);
          return 0;
        }
        playTTS(nextTime.toString());
        return nextTime;
      });
    }, 1000);
  }, [clearAllTimers]);

  const startInterruptSequence = useCallback(() => {
    setTimerStatus('INTERRUPT_SPEECH');
    setTimeLeft(5); 
    triggerHaptic([50, 50, 50]); // Warning vibration pattern
    
    let isEnded = false;
    const onEnd = () => {
      if (isEnded) return;
      isEnded = true;
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      
      setTimerStatus((currentStatus) => {
        if (currentStatus === 'INTERRUPT_SPEECH') {
          start5sCountdown();
          return 'RUNNING_5';
        }
        return currentStatus;
      });
    };

    playTTS('모든 참가자는 5초 뒤 눈을 떠주세요.', onEnd);
    speechTimeoutRef.current = window.setTimeout(onEnd, 4500); 
  }, [start5sCountdown]);

  const handleTimerClick = () => {
    unlockAudioContext(); // Ensure audio is unlocked on first touch
    triggerHaptic(10); // Short tick feedback
    if (timerStatus === 'STANDBY') {
      requestWakeLock(); // Screen stays on
      clearAllTimers();
      setTimerStatus('RUNNING_60');
      setTimeLeft(60);
      playTTS('60');
      
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          const nextTime = prev - 1;
          if (nextTime <= 0) {
            clearAllTimers();
            startInterruptSequence();
            return 0;
          }
          playTTS(nextTime.toString());
          return nextTime;
        });
      }, 1000);
      
    } else if (timerStatus === 'RUNNING_60') {
      clearAllTimers();
      startInterruptSequence();
    } else if (timerStatus === 'INTERRUPT_SPEECH' || timerStatus === 'RUNNING_5') {
      clearAllTimers();
      stopTTS();
      setTimerStatus('STANDBY');
      setTimeLeft(60);
      releaseWakeLock(); // Allow screen sleep
    }
  };

  const handleNarratorClick = (id: number, text: string) => {
    unlockAudioContext();
    triggerHaptic(10);
    setActiveNarrator(id);
    
    if (timerStatus !== 'STANDBY') {
      clearAllTimers();
      stopTTS();
      setTimerStatus('STANDBY');
      setTimeLeft(60);
      releaseWakeLock();
    }

    playTTS(text);

    setTimeout(() => {
      setActiveNarrator(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
      stopTTS();
    };
  }, [clearAllTimers]);

  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const maxTime = (timerStatus === 'INTERRUPT_SPEECH' || timerStatus === 'RUNNING_5') ? 5 : 60;
  const safeMaxTime = maxTime || 1; 
  const dashoffset = circumference - (timeLeft / safeMaxTime) * circumference;
  
  const isInterruptGroup = timerStatus === 'INTERRUPT_SPEECH' || timerStatus === 'RUNNING_5';

  const getPhaseText = () => {
    if (activeNarrator) {
      const narrator = narratorPhases.find(p => p.id === activeNarrator);
      return `PLAYING: ${narrator?.label}`;
    }
    switch (timerStatus) {
      case 'RUNNING_60': return 'COUNTDOWN SEQUENCE';
      case 'INTERRUPT_SPEECH': return 'PREPARING OVERRIDE';
      case 'RUNNING_5': return 'EMERGENCY OVERRIDE';
      default: return 'SYSTEM STANDBY';
    }
  };

  // --- Style Logic Separated for Stability ---
  const timerButtonClass = [
    "relative flex items-center justify-center w-56 h-56 rounded-full transition-all duration-300",
    timerStatus === 'RUNNING_60' ? 'shadow-[0_0_30px_rgba(255,140,0,0.3)]' : '',
    isInterruptGroup ? 'shadow-[0_0_40px_rgba(239,68,68,0.4)]' : ''
  ].join(' ');

  const getPhaseIndicatorClass = () => {
    return `text-sm tracking-widest ${isInterruptGroup ? 'text-red-500 animate-blink' : 'text-dystopia-grey'}`;
  };

  const getNarratorButtonClass = (id: number) => {
    return `cyber-button flex flex-col items-center justify-center p-2 rounded-md h-16 ${activeNarrator === id ? 'active' : ''}`;
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-2xl mx-auto bg-dystopia-black text-terminal-text p-4 pb-safe-bottom">
      {/* Header / Phase Indicator */}
      <div className="flex justify-between items-center mb-6 border-b border-dystopia-charcoal pb-4 pt-2">
        <div className="flex items-center space-x-2 text-neon-orange font-bold text-xl tracking-widest">
          <Target className="w-6 h-6 animate-pulse-slow" />
          <span>2910</span>
        </div>
        <div className={getPhaseIndicatorClass()}>
          [{getPhaseText()}]
        </div>
      </div>

      {/* Main Timer Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-4">
        
        {/* Adjusted Crosshair Focus matching the image */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
          <div className="w-[320px] h-[320px] relative">
            <div className="crosshair-corner crosshair-tl"></div>
            <div className="crosshair-corner crosshair-tr"></div>
            <div className="crosshair-corner crosshair-bl"></div>
            <div className="crosshair-corner crosshair-br"></div>
          </div>
        </div>

        <button 
          onClick={handleTimerClick}
          className={timerButtonClass}
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            {/* Base orange ring matching the image */}
            <circle cx="112" cy="112" r={radius} fill="transparent" stroke="#ff8c00" strokeWidth="4" />
            
            {/* Decreasing dark overlay ring for countdown effect */}
            <circle
              cx="112" cy="112" r={radius} fill="transparent"
              stroke={isInterruptGroup ? "#ef4444" : "#1a1a1a"}
              strokeWidth="5" 
              strokeDasharray={circumference} 
              strokeDashoffset={dashoffset}
              strokeLinecap="butt" 
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center w-48 h-48 rounded-full bg-[#1a1a1a] z-10">
             {isInterruptGroup && <AlertTriangle className="w-8 h-8 text-red-500 mb-2 animate-blink" />}
             <div className={`text-6xl font-bold tracking-normal tabular-nums ${isInterruptGroup ? 'text-red-500' : 'text-gray-200'}`}>
               {timeLeft}
             </div>
             <div className="text-dystopia-grey text-[10px] mt-4 tracking-[0.2em] text-center px-4 leading-tight font-mono uppercase">
               {timerStatus === 'RUNNING_60' ? 'TAP TO INTERRUPT' : 
                timerStatus === 'INTERRUPT_SPEECH' ? 'SPEAKING... TAP TO STOP' :
                timerStatus === 'RUNNING_5' ? 'EMERGENCY OVERRIDE' : 
                'TAP TO START SCAN'}
             </div>
          </div>
        </button>
      </div>

      {/* City Image Decoration */}
      <div className="w-full mb-4 pointer-events-none flex justify-center">
        <img src="/bg.png" alt="City Skyline" className="w-full max-h-[15vh] object-contain object-bottom opacity-80" />
      </div>

      {/* Narrator Control Panel */}
      <div className="mb-4">
        <div className="text-xs text-dystopia-grey mb-3 tracking-widest border-b border-dystopia-charcoal pb-1">
          // SYSTEM NARRATOR PANEL
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {narratorPhases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => handleNarratorClick(phase.id, phase.text)}
              className={getNarratorButtonClass(phase.id)}
            >
              <span className="text-sm font-bold tracking-wider">{phase.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}