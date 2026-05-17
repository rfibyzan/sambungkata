import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Send } from 'lucide-react';

interface WordInputProps {
  onSubmit: (word: string) => void;
  isLoading: boolean;
  disabled: boolean;
  lastWord?: string;
  getStartHint?: (word: string) => string;
}

export default function WordInput({ onSubmit, isLoading, disabled, lastWord, getStartHint }: WordInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled && !isLoading) {
      onSubmit(input);
      setInput('');
    }
  };

  const hint = lastWord && getStartHint ? getStartHint(lastWord) : '';

  return (
    <form onSubmit={handleSubmit} className="relative">
      {lastWord && (
        <div className="absolute -top-6 left-2 text-xs text-slate-400">
          Harus diawali dengan: <span className="text-indigo-400 font-bold uppercase">{hint}</span>
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toLowerCase())}
          disabled={disabled || isLoading}
          placeholder={lastWord ? `Awali dengan "${hint}"...` : "Mulai dengan kata apa saja..."}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
        />
        <button
          type="submit"
          disabled={disabled || isLoading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors w-14"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
}
