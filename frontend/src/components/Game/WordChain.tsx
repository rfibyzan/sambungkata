import { useEffect, useRef } from 'react';

interface WordChainProps {
  words: string[];
}

export default function WordChain({ words }: WordChainProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [words]);

  return (
    <div 
      ref={scrollRef}
      className="h-64 sm:h-80 overflow-y-auto p-4 space-y-3 glass-panel rounded-2xl scroll-smooth"
    >
      {words.length === 0 ? (
        <div className="h-full flex items-center justify-center text-slate-500 italic">
          Mulai permainan dengan memasukkan kata pertama...
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 items-center">
          {words.map((word, index) => (
            <div key={index} className="flex items-center animate-in slide-in-from-right-4 duration-300 fade-in">
              <div className="px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-100 font-medium shadow-sm">
                {word}
              </div>
              {index < words.length - 1 && (
                <div className="mx-2 text-slate-500">→</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
