interface TimerProps {
  timeLeft: number;
  isActive: boolean;
}

export default function Timer({ timeLeft, isActive }: TimerProps) {
  const getTimerColor = () => {
    if (timeLeft > 15) return 'text-emerald-400';
    if (timeLeft > 5) return 'text-amber-400';
    return 'text-red-500 animate-pulse font-bold';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-slate-400">Waktu:</div>
      <div className={`text-2xl font-mono ${isActive ? getTimerColor() : 'text-slate-500'}`}>
        00:{timeLeft.toString().padStart(2, '0')}
      </div>
    </div>
  );
}
