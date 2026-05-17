import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';

export default function GamePage() {
  const [words, setWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameOver, setGameOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    
    // If it's the first word, requiredStart is empty.
    const fullWord = (requiredStart + inputValue.toLowerCase().trim()).trim();
    if (!fullWord) return;

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

  const handleRestart = () => {
    setWords([]);
    setScore(0);
    setTimeLeft(45);
    setGameOver(false);
    setErrorMsg('');
    setInputValue('');
    setShowToast(false);
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

  return (
    <div className="w-full max-w-max-width-content mx-auto px-margin-mobile md:px-margin-desktop py-lg pb-xl mb-xl md:mb-0">
      
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
        <div className="md:col-span-1 bg-surface rounded-xl shadow-sm border border-outline-variant p-md flex flex-col h-[500px]">
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
        <div className="md:col-span-2 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant p-lg flex flex-col justify-center relative overflow-hidden">
          
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
              <div className="text-center mb-xl mt-xl">
                <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">Last Word</div>
                {renderHighlightedLastWord()}
                <div className="mt-sm font-body-md text-body-md text-outline">
                  {lastWord ? (
                    <>Next word must start with <strong className="text-secondary-container uppercase">{requiredStart}</strong></>
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
    </div>
  );
}
