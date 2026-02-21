import { useState, useEffect, useRef, useCallback } from 'react';
import { Target, AlertTriangle } from 'lucide-react';
import { useWakeLock } from './hooks/useWakeLock';

const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const unlockAudioContext = () => {
  if (!('speechSynthesis' in window)) return;
  
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContext) {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    oscillator.connect(ctx.destination);
    oscillator.start(0);
    oscillator.stop(0.001);
  }
};

type TimerStatus = 'STANDBY' | 'RUNNING_60' | 'INTERRUPT_SPEECH' | 'RUNNING_5';

export default function App() {
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('STANDBY');
  const [timeLeft, setTimeLeft] = useState(60);
  const [activeNarrator, setActiveNarrator] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);

  // Initialize BGM
  useEffect(() => {
    bgmRef.current = new Audio('/audio/bgm.wav');
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.3; // Lower volume for background
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  const playBGM = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.currentTime = 0;
      bgmRef.current.play().catch(e => console.log('BGM play failed:', e));
    }
  }, []);

  const stopBGM = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
  }, []);

  const playAudio = useCallback((filename: string, onEnd?: () => void) => {
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(`/audio/timer/${filename}.mp3`);
    audioRef.current = audio;
    
    if (onEnd) {
      audio.onended = onEnd;
      // Fallback if audio fails or takes too long
      audio.onerror = onEnd;
    }

    audio.play().catch(e => console.error("Audio play failed", e));
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

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
    playAudio('5'); // Play "5"
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const nextTime = prev - 1;
        if (nextTime < 0) { // Changed from <= 0 to < 0 to show 0
          clearAllTimers();
          setTimerStatus('STANDBY');
          setTimeLeft(60);
          stopBGM();
          return 0;
        }
        playAudio(nextTime.toString());
        return nextTime;
      });
    }, 1000);
  }, [clearAllTimers, playAudio, stopBGM]);

  const startInterruptSequence = useCallback(() => {
    setTimerStatus('INTERRUPT_SPEECH');
    setTimeLeft(5); 
    triggerHaptic([50, 50, 50]); 
    
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

    playAudio('interrupt', onEnd);
    speechTimeoutRef.current = window.setTimeout(onEnd, 5500); 
  }, [start5sCountdown, playAudio]);

  const handleTimerClick = () => {
    unlockAudioContext(); 
    triggerHaptic(10); 
    if (timerStatus === 'STANDBY') {
      requestWakeLock(); 
      clearAllTimers();
      setTimerStatus('RUNNING_60');
      setTimeLeft(60);
      playAudio('60');
      playBGM();
      
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          const nextTime = prev - 1;
          if (nextTime <= 0) {
            clearAllTimers();
            startInterruptSequence();
            return 0;
          }
          playAudio(nextTime.toString());
          return nextTime;
        });
      }, 1000);
      
    } else if (timerStatus === 'RUNNING_60') {
      clearAllTimers();
      startInterruptSequence();
    } else if (timerStatus === 'INTERRUPT_SPEECH' || timerStatus === 'RUNNING_5') {
      clearAllTimers();
      stopAudio();
      stopBGM();
      setTimerStatus('STANDBY');
      setTimeLeft(60);
      releaseWakeLock(); 
    }
  };

  const handleNarratorClick = (id: number, text: string) => {
    unlockAudioContext();
    triggerHaptic(10);
    setActiveNarrator(id);
    
    if (timerStatus !== 'STANDBY') {
      clearAllTimers();
      stopAudio();
      stopBGM();
      setTimerStatus('STANDBY');
      setTimeLeft(60);
      releaseWakeLock();
    }

    // Placeholder for narrator audio
    console.log(`Playing narrator ${id}: ${text}`);
    setTimeout(() => {
      setActiveNarrator(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
      stopAudio();
      stopBGM();
    };
  }, [clearAllTimers, stopAudio, stopBGM]);

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

  // --- Style Logic ---
  const timerButtonClass = [
    "relative flex items-center justify-center w-[60vmin] h-[60vmin] rounded-full transition-all duration-300",
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
          <div className="w-[85vmin] h-[85vmin] relative">
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
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 300 300">
            {/* Base orange ring */}
            <circle cx="150" cy="150" r="120" fill="transparent" stroke="#ff8c00" strokeWidth="6" />
            
            {/* Decreasing dark overlay ring */}
            <circle
              cx="150" cy="150" r="120" fill="transparent"
              stroke={isInterruptGroup ? "#ef4444" : "#1a1a1a"}
              strokeWidth="8" 
              strokeDasharray={2 * Math.PI * 120} 
              strokeDashoffset={2 * Math.PI * 120 - (timeLeft / safeMaxTime) * (2 * Math.PI * 120)}
              strokeLinecap="butt" 
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center w-[50vmin] h-[50vmin] rounded-full bg-[#1a1a1a] z-10">
             {isInterruptGroup && <AlertTriangle className="w-8 h-8 text-red-500 mb-2 animate-blink" />}
             <div className={`text-[15vmin] font-bold tracking-normal tabular-nums ${isInterruptGroup ? 'text-red-500' : 'text-gray-200'}`}>
               {timeLeft}
             </div>
             <div className="text-dystopia-grey text-[2.5vmin] mt-4 tracking-[0.2em] text-center px-4 leading-tight font-mono uppercase">
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