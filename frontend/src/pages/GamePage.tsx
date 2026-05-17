import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';

export default function GamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [words, setWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameOver, setGameOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);
  const [hasSavedScore, setHasSavedScore] = useState(false);

  // Navigation interceptor states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const isLeavingRef = useRef(false);

  const [hasStarted, setHasStarted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Intercept Page Unload / Reload / Close Tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (words.length > 0 && !gameOver && !isLeavingRef.current) {
        e.preventDefault();
        e.returnValue = 'Anda yakin ingin keluar? Skor Anda saat ini tidak akan disimpan.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [words, gameOver]);

  // 2. Intercept Internal Clicks (Capture Phase)
  useEffect(() => {
    if (words.length > 0 && !gameOver) {
      const handleGlobalClick = (e: MouseEvent) => {
        if (isLeavingRef.current) return;

        const target = e.target as HTMLElement;
        const anchor = target.closest('a');
        if (anchor) {
          try {
            const url = new URL(anchor.href, window.location.href);
            // Only intercept if going to a different internal route
            if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
              e.preventDefault();
              e.stopPropagation();
              setPendingHref(url.pathname + url.search + url.hash);
              setIsConfirmModalOpen(true);
            }
          } catch (err) {
            // Ignored
          }
        }
      };
      document.addEventListener('click', handleGlobalClick, true);
      return () => {
        document.removeEventListener('click', handleGlobalClick, true);
      };
    }
  }, [words, gameOver]);

  // 3. Intercept PopState (Browser Back/Forward Buttons)
  useEffect(() => {
    if (words.length > 0 && !gameOver) {
      // Push initial dummy state to enable popstate capture
      window.history.pushState(null, '', window.location.href);
      
      const handlePopState = () => {
        if (isLeavingRef.current) return;
        
        setIsConfirmModalOpen(true);
        setPendingHref('BACK_BUTTON');
        
        // Re-push a dummy state to keep the block active!
        window.history.pushState(null, '', window.location.href);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [words, gameOver]);

  const confirmLeave = () => {
    isLeavingRef.current = true;
    setIsConfirmModalOpen(false);
    
    if (pendingHref === 'BACK_BUTTON') {
      // Go back twice (once for popstate dummy, once for original back)
      window.history.go(-2);
    } else if (pendingHref) {
      navigate(pendingHref);
    }
  };

  useEffect(() => {
    if (words.length > 0 && !gameOver) {
      setTimeLeft(45);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [words, gameOver]);

  useEffect(() => {
    if (!gameOver && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameOver, words]);

  useEffect(() => {
    if (gameOver && user && score > 0 && !hasSavedScore) {
      const saveSession = async () => {
        try {
          // 1. Save to game_sessions
          const { error: sessionError } = await supabase
            .from('game_sessions')
            .insert({
              user_id: user.id,
              score: score,
              word_count: words.length,
              mode: 'singleplayer',
            });
          
          if (sessionError) {
            console.error("Gagal menyimpan sesi game:", sessionError);
          }

          // 2. Save to leaderboard
          const { error: leaderboardError } = await supabase
            .from('leaderboard')
            .insert({
              user_id: user.id,
              score: score,
              mode: 'singleplayer',
            });
            
          if (leaderboardError) {
            console.error("Gagal menyimpan skor leaderboard:", leaderboardError);
          }

          if (!sessionError && !leaderboardError) {
            setHasSavedScore(true);
          }
        } catch (err) {
          console.error("Gagal menyimpan skor:", err);
        }
      };
      saveSession();
    }
  }, [gameOver, user, score, words, hasSavedScore]);

  const getLastSyllableOrChar = (word: string) => {
    if (!word) return '';
    if (word.length <= 2) return word.toLowerCase();
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const lastChar = word.slice(-1).toLowerCase();
    const secondLast = word.slice(-2, -1).toLowerCase();
    if (vowels.includes(lastChar) && !vowels.includes(secondLast)) {
      return word.slice(-2).toLowerCase();
    }
    return word.slice(-2).toLowerCase();
  };

  const lastWord = words.length > 0 ? words[words.length - 1] : '';
  const requiredStart = getLastSyllableOrChar(lastWord);

  const handleWordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (gameOver || isLoading) return;
    
    const typedWord = inputValue.toLowerCase().trim();
    if (!typedWord) return;

    // Intelligent Submit: check if typedWord already starts with the required start characters
    let fullWord = typedWord;
    if (requiredStart) {
      const normalizedReq = requiredStart.toLowerCase();
      if (!typedWord.startsWith(normalizedReq)) {
        fullWord = normalizedReq + typedWord;
      }
    }

    if (words.includes(fullWord)) {
      setErrorMsg('Kata sudah digunakan!');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:5000/api/game/validate-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: fullWord })
      });
      const data = await res.json();
      
      if (data.valid) {
        const points = fullWord.length * 10 + timeLeft;
        setWords([...words, data.word]);
        setScore(score + points);
        setLastPoints(points);
        setInputValue('');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setErrorMsg('Kata tidak valid di KBBI!');
        setGameOver(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (err) {
      setErrorMsg('Gagal memvalidasi kata. Server error?');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRandomStartWord = async () => {
    setIsInitializing(true);
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:5000/api/game/random-word');
      const data = await res.json();
      if (data && data.word) {
        setWords([data.word]);
      } else {
        setWords(['aksara']);
      }
    } catch (err) {
      console.error("Gagal mengambil kata acak pertama:", err);
      setWords(['aksara']);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStartGame = () => {
    setHasStarted(true);
    fetchRandomStartWord();
  };

  const handleRestart = () => {
    setWords([]);
    setScore(0);
    setTimeLeft(45);
    setGameOver(false);
    setErrorMsg('');
    setInputValue('');
    setShowToast(false);
    setHasSavedScore(false);
    setHasStarted(false); // Return to Start screen
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderHighlightedLastWord = () => {
    if (!lastWord) return <div className="font-display-lg text-display-lg text-primary font-bold">Mulai!</div>;
    const prefix = lastWord.slice(0, lastWord.length - requiredStart.length);
    return (
      <div className="font-display-lg text-display-lg text-primary font-bold capitalize">
        {prefix}<span className="text-secondary-container lowercase">{requiredStart}</span>
      </div>
    );
  };

  if (isInitializing) {
    return (
      <div className="w-full max-w-max-width-content mx-auto px-margin-mobile md:px-margin-desktop py-lg pb-xl flex flex-col items-center justify-center min-h-[500px] gap-sm">
        <span className="material-symbols-outlined animate-spin text-[48px] text-primary">progress_activity</span>
        <span className="font-label-md text-label-md text-outline">Menyiapkan kata acak pertama...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-max-width-content mx-auto px-margin-mobile md:px-margin-desktop py-md md:py-lg">
      {!hasStarted ? (
        <div className="w-full max-w-[480px] mx-auto bg-surface-container-low border border-outline-variant rounded-2xl p-sm sm:p-md md:p-lg shadow-lg relative flex flex-col items-center text-center gap-xs sm:gap-sm md:gap-md my-1 sm:my-3 md:my-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-md animate-bounce duration-1000">
            <span className="material-symbols-outlined text-[26px] md:text-[36px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl text-primary font-bold">Mulai SambungKata</h2>
            <p className="font-body-md text-[11px] sm:text-xs md:text-sm text-on-surface-variant mt-0.5 max-w-[400px] leading-relaxed">
              Platform permainan kata berantai yang menantang! Sistem akan memilih kata awal secara acak dari KBBI untuk Anda lanjutkan.
            </p>
          </div>
          
          <div className="bg-surface-container rounded-xl p-2 sm:p-3 w-full text-left border border-outline-variant/40 flex flex-col gap-1">
            <h4 className="font-title-sm text-[11px] sm:text-xs md:text-sm text-on-surface font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[16px] sm:text-[18px]">info</span>
              Cara Bermain:
            </h4>
            <ul className="list-disc list-inside space-y-0.5 font-body-sm text-[10px] sm:text-[11px] md:text-xs text-on-surface-variant leading-relaxed">
              <li>Sistem menyajikan kata awal (misal: <strong className="text-primary font-bold">Aksa<span className="text-secondary-container">ra</span></strong>).</li>
              <li>Tulis kata baru dari suku kata terakhir (misal: <strong className="text-primary font-bold"><span className="text-secondary-container">Ra</span>mi</strong>).</li>
              <li>Waktu menjawab adalah <strong className="text-secondary-container font-bold">45 detik</strong> per kata.</li>
              <li>Dapatkan skor tertinggi untuk puncaki Papan Peringkat!</li>
            </ul>
          </div>

          <button 
            type="button"
            onClick={handleStartGame}
            className="w-full mt-1 bg-primary hover:bg-primary-fixed-variant text-on-primary font-title-sm text-xs sm:text-sm md:text-base py-2 sm:py-2.5 rounded-xl shadow-[0_3px_0_0_rgba(0,23,75,1)] active:shadow-none active:translate-y-[3px] hover:scale-[1.01] active:scale-95 transition-all flex justify-center items-center gap-1 cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            <span>Mulai Permainan</span>
          </button>
        </div>
      ) : (
        <>
      
      {/* Game Status Bar */}
      <div className="flex justify-between items-center bg-surface-container-low rounded-xl p-md shadow-sm mb-lg">
        <div className="flex items-center gap-sm">
          <div className={`rounded-full p-2 flex items-center justify-center ${timeLeft <= 10 ? 'bg-error text-on-error animate-pulse' : 'bg-primary text-on-primary'}`}>
            <span className="material-symbols-outlined">timer</span>
          </div>
          <div>
            <div className="font-label-sm text-label-sm text-on-surface-variant">Time Remaining</div>
            <div className={`font-headline-lg-mobile text-headline-lg-mobile ${timeLeft <= 10 ? 'text-error' : 'text-primary'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-sm text-right">
          <div>
            <div className="font-label-sm text-label-sm text-on-surface-variant">Current Score</div>
            <div className="font-headline-lg-mobile text-headline-lg-mobile text-secondary-container">
              {score.toLocaleString()}
            </div>
          </div>
          <div className="bg-secondary-container text-on-secondary-container rounded-full p-2 flex items-center justify-center">
            <span className="material-symbols-outlined">star</span>
          </div>
        </div>
      </div>

      {/* Game Area Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        
        {/* Left Column: Word Chain History */}
        <div className="md:col-span-1 bg-surface rounded-xl shadow-sm border border-outline-variant p-md flex flex-col h-[260px] md:h-[430px]">
          <h2 className="font-title-md text-title-md text-on-surface mb-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span> Word Chain
          </h2>
          <div className="flex-grow overflow-y-auto pr-2 space-y-sm">
            {words.length === 0 && (
              <div className="text-center text-outline text-sm mt-8">Belum ada kata.</div>
            )}
            {words.map((w, i) => {
              const isLast = i === words.length - 1;
              // Approximate points for visual history
              const pts = w.length * 10 + 20; 
              return (
                <div key={i}>
                  <div 
                    className={`px-4 py-2 rounded-lg flex justify-between items-center ${
                      isLast 
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' 
                        : 'bg-surface-container text-on-surface'
                    }`}
                    style={{ opacity: isLast ? 1 : Math.max(0.4, 1 - (words.length - 1 - i) * 0.15) }}
                  >
                    <span className="font-body-md text-body-md capitalize">{w}</span>
                    <span className="font-label-sm text-label-sm text-primary">+{pts}</span>
                  </div>
                  {!isLast && (
                    <div className="flex justify-center text-outline my-1">
                      <span className="material-symbols-outlined text-sm">arrow_downward</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Play Area */}
        <div className="md:col-span-2 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant p-md md:p-lg flex flex-col justify-center relative overflow-hidden h-[300px] md:h-[430px]">
          
          {/* Feedback Toast */}
          {showToast && !gameOver && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-tertiary-container text-on-tertiary-container px-md py-sm rounded-full shadow-md flex items-center gap-2 z-10 animate-in slide-in-from-top-4 fade-in duration-300">
              <span className="material-symbols-outlined">check_circle</span>
              <span className="font-label-md text-label-md">Great word! +{lastPoints} points</span>
            </div>
          )}

          {errorMsg && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-error text-on-error px-md py-sm rounded-full shadow-md flex items-center gap-2 z-10 animate-in bounce-in duration-300">
              <span className="material-symbols-outlined">error</span>
              <span className="font-label-md text-label-md">{errorMsg}</span>
            </div>
          )}

          {!gameOver ? (
            <>
              <div className="text-center my-md md:my-lg">
                <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">Last Word</div>
                {renderHighlightedLastWord()}
                <div className="mt-sm font-body-md text-body-md text-outline">
                  {lastWord ? (
                    <>Kata berikutnya harus diawali <strong className="text-secondary-container uppercase">{requiredStart}</strong> <span className="text-outline-variant text-sm block mt-1">(Bisa ketik kata lengkap atau lanjutannya saja)</span></>
                  ) : (
                    <>Ketik kata pertama untuk memulai permainan!</>
                  )}
                </div>
              </div>

              <form onSubmit={handleWordSubmit} className="w-full">
                <div className="relative">
                  {requiredStart && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="font-headline-lg-mobile text-headline-lg-mobile text-secondary-container font-bold">{requiredStart}</span>
                    </div>
                  )}
                  <input 
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.toLowerCase())}
                    disabled={isLoading}
                    autoComplete="off"
                    spellCheck="false"
                    placeholder={lastWord ? "lanjutan..." : "ketik kata..."}
                    className={`w-full ${requiredStart ? 'pl-14' : 'pl-4'} pr-4 py-md bg-surface border-2 border-primary-fixed rounded-xl font-headline-lg-mobile text-headline-lg-mobile text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container/20 transition-all shadow-sm`}
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={isLoading || (!inputValue.trim() && !!lastWord)}
                  className="w-full mt-md bg-secondary-container hover:bg-secondary disabled:bg-surface-variant disabled:text-outline text-on-secondary-container hover:text-on-secondary font-title-md text-title-md py-md rounded-xl shadow-[0_4px_0_0_rgba(133,83,0,1)] active:shadow-none active:translate-y-[4px] disabled:shadow-none disabled:active:translate-y-0 transition-all flex justify-center items-center gap-2"
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  ) : (
                    <>
                      <span>Submit Word</span>
                      <span className="material-symbols-outlined">send</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6 my-auto">
              <div className="text-error mb-2">
                <span className="material-symbols-outlined text-[64px]">cancel</span>
              </div>
              <h2 className="font-display-lg text-display-lg text-error">Game Over!</h2>
              <div className="font-body-lg text-body-lg text-on-surface-variant">
                Skor Akhir: <strong className="text-primary text-2xl ml-2">{score.toLocaleString()}</strong>
              </div>
              <button 
                onClick={handleRestart}
                className="mx-auto mt-lg bg-primary hover:bg-primary-fixed-variant text-on-primary font-title-md text-title-md px-xl py-md rounded-xl shadow-[0_4px_0_0_rgba(0,23,75,1)] active:shadow-none active:translate-y-[4px] transition-all flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined">refresh</span>
                <span>Main Lagi</span>
              </button>
            </div>
          )}
        </div>
      </div>
      </>
    )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-[90vw] sm:w-[450px] p-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-md text-center items-center">
            <div className="w-16 h-16 bg-error-container text-on-error-container rounded-full flex items-center justify-center mb-sm shadow-inner border border-error/15">
              <span className="material-symbols-outlined text-[36px] text-error">warning</span>
            </div>
            <div>
              <h3 className="font-headline-lg-mobile text-[22px] text-on-surface font-bold">Keluar Permainan?</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                Anda sedang dalam permainan aktif! Jika Anda keluar sekarang, **permainan akan langsung terhenti** dan skor Anda saat ini (<strong className="text-primary font-bold">{score.toLocaleString()}</strong>) tidak akan disimpan ke papan peringkat.
              </p>
            </div>
            <div className="flex w-full gap-sm mt-md border-t border-outline-variant/40 pt-md">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setPendingHref(null);
                }}
                className="flex-1 px-6 py-2.5 rounded-xl font-label-md text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant"
              >
                Lanjutkan Main
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="flex-1 bg-error text-on-error font-label-md px-6 py-2.5 rounded-xl hover:bg-error/90 active:scale-95 transition-all cursor-pointer shadow-sm border-b-[3px] border-[#93000a] active:border-b-0 active:translate-y-[3px]"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
