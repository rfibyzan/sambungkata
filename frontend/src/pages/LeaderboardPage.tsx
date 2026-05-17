import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { Link } from 'react-router-dom';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string;
  score: number;
}

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('leaderboard')
        .select(`
          user_id,
          score,
          users (
            id,
            username,
            avatar_url
          )
        `)
        .order('score', { ascending: false });

      if (dbError) throw dbError;

      if (data) {
        // Deduplicate: Keep only the highest score for each unique user_id
        const uniqueEntries: Record<string, LeaderboardEntry> = {};
        data.forEach((row: any) => {
          const uid = row.user_id;
          if (!uid) return;
          const score = row.score || 0;
          
          let username = 'Pemain';
          let avatarUrl = '';
          
          if (row.users) {
            if (Array.isArray(row.users)) {
              if (row.users.length > 0) {
                username = row.users[0]?.username || 'Pemain';
                avatarUrl = row.users[0]?.avatar_url || '';
              }
            } else {
              username = row.users.username || 'Pemain';
              avatarUrl = row.users.avatar_url || '';
            }
          }

          if (!uniqueEntries[uid] || uniqueEntries[uid].score < score) {
            uniqueEntries[uid] = {
              user_id: uid,
              username,
              avatar_url: avatarUrl,
              score,
            };
          }
        });

        // Convert to array and sort descending by score
        const sortedList = Object.values(uniqueEntries).sort((a, b) => b.score - a.score);
        setLeaderboard(sortedList);
      }
    } catch (err: any) {
      console.error('Error fetching leaderboard data:', err);
      setError('Gagal memuat papan peringkat. Silakan coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Helper to render public avatar images or fallbacks
  const renderAvatar = (entry: LeaderboardEntry, sizeClass: string = 'w-12 h-12') => {
    if (entry.avatar_url) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden border border-outline-variant/40 bg-surface shadow-sm`}>
          <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
        </div>
      );
    }
    const letter = (entry.username || 'P').charAt(0).toUpperCase();
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-tr from-primary to-surface-tint flex items-center justify-center font-bold text-on-primary shadow-sm border border-white/20 capitalize`}>
        {letter}
      </div>
    );
  };

  // Extract Podium Places
  const firstPlace = leaderboard[0];
  const secondPlace = leaderboard[1];
  const thirdPlace = leaderboard[2];

  // List all entries from rank 1 onwards
  const listEntries = leaderboard;

  // Calculate Logged-in User's Rank
  const myRankIndex = user ? leaderboard.findIndex((item) => item.user_id === user.id) : -1;
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;
  const myBestScore = myRankIndex !== -1 ? leaderboard[myRankIndex].score : 0;

  return (
    <div className="w-full max-w-max-width-content mx-auto px-margin-mobile md:px-margin-desktop py-md md:py-lg flex flex-col gap-md">
      
      {/* Title */}
      <div className="text-center mb-md mt-sm">
        <h1 className="font-display-lg text-display-lg text-primary mb-xs">Papan Peringkat</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Pemain terbaik dengan rantai kata terpanjang di Indonesia.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-sm">
          <span className="material-symbols-outlined animate-spin text-[48px] text-primary">progress_activity</span>
          <span className="font-label-md text-label-md text-outline">Memuat skor pemain terbaik...</span>
        </div>
      ) : error ? (
        <div className="bg-error-container text-on-error-container border border-error/20 p-lg rounded-2xl text-center max-w-md mx-auto my-xl shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-error mb-sm">error</span>
          <p className="font-body-md text-body-md mb-md">{error}</p>
          <button 
            onClick={fetchLeaderboard}
            className="bg-primary text-on-primary font-label-md px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {/* Top 3 Podiums (Visual 3D Podium Layout) */}
          <div className="grid grid-cols-3 gap-xs sm:gap-md items-end mb-lg pt-lg max-w-lg sm:max-w-xl md:max-w-2xl w-full mx-auto h-[270px] sm:h-[300px]">
            
            {/* 2nd Place */}
            <div className="flex flex-col items-center justify-end order-1">
              {secondPlace ? (
                <>
                  {renderAvatar(secondPlace, 'w-14 h-14 sm:w-16 sm:h-16')}
                  <div 
                    style={{ animationDelay: '250ms' }}
                    className="bg-surface-container-low rounded-t-2xl w-full flex flex-col items-center py-md border-t-4 border-outline-variant shadow-sm h-32 relative mt-sm animate-pilar-2"
                  >
                    <div className="absolute -top-3 bg-outline-variant text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">#2</div>
                    <span className="font-title-md text-title-md text-on-surface mt-sm text-center line-clamp-1 w-full px-2 capitalize">{secondPlace.username}</span>
                    <span className="font-label-md text-label-md text-primary mt-xs font-semibold">{secondPlace.score.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div 
                  style={{ animationDelay: '250ms' }}
                  className="bg-surface-container-low/40 rounded-t-2xl w-full flex flex-col items-center justify-center py-md border-t-4 border-outline-variant/30 h-32 relative animate-pilar-2"
                >
                  <div className="absolute -top-3 bg-outline-variant/30 text-outline font-label-sm text-label-sm px-2 py-0.5 rounded-full">#2</div>
                  <span className="font-label-sm text-label-sm text-outline">Kosong</span>
                </div>
              )}
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center justify-end order-2 z-10 relative -mt-lg">
              {firstPlace ? (
                <>
                  <span className="material-symbols-outlined text-secondary-container mb-xs animate-bounce" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  {renderAvatar(firstPlace, 'w-18 h-18 sm:w-20 sm:h-20 border-4 border-secondary-container shadow-md')}
                  <div 
                    style={{ animationDelay: '450ms' }}
                    className="bg-surface-container rounded-t-2xl w-full flex flex-col items-center py-md border-t-4 border-secondary-container shadow-md h-40 relative mt-sm animate-pilar-1"
                  >
                    <div className="absolute -top-3 bg-secondary-container text-on-secondary-container font-label-md text-label-md px-3 py-0.5 rounded-full font-bold">#1</div>
                    <span className="font-title-md text-title-md text-on-surface mt-sm text-center line-clamp-1 w-full px-2 capitalize font-bold">{firstPlace.username}</span>
                    <span className="font-label-md text-label-md text-primary mt-xs font-bold text-lg">{firstPlace.score.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div 
                  style={{ animationDelay: '450ms' }}
                  className="bg-surface-container/40 rounded-t-2xl w-full flex flex-col items-center justify-center py-md border-t-4 border-secondary-container/30 h-40 relative animate-pilar-1"
                >
                  <div className="absolute -top-3 bg-secondary-container/30 text-outline font-label-sm text-label-sm px-2 py-0.5 rounded-full">#1</div>
                  <span className="font-label-sm text-label-sm text-outline">Kosong</span>
                </div>
              )}
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center justify-end order-3">
              {thirdPlace ? (
                <>
                  {renderAvatar(thirdPlace, 'w-14 h-14 sm:w-16 sm:h-16')}
                  <div 
                    style={{ animationDelay: '100ms' }}
                    className="bg-surface-container-low rounded-t-2xl w-full flex flex-col items-center py-md border-t-4 border-[#cd7f32] shadow-sm h-28 relative mt-sm animate-pilar-3"
                  >
                    <div className="absolute -top-3 bg-[#cd7f32] text-white font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">#3</div>
                    <span className="font-title-md text-title-md text-on-surface mt-sm text-center line-clamp-1 w-full px-2 capitalize">{thirdPlace.username}</span>
                    <span className="font-label-md text-label-md text-primary mt-xs font-semibold">{thirdPlace.score.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div 
                  style={{ animationDelay: '100ms' }}
                  className="bg-surface-container-low/40 rounded-t-2xl w-full flex flex-col items-center justify-center py-md border-t-4 border-[#cd7f32]/30 h-28 relative animate-pilar-3"
                >
                  <div className="absolute -top-3 bg-[#cd7f32]/30 text-outline font-label-sm text-label-sm px-2 py-0.5 rounded-full">#3</div>
                  <span className="font-label-sm text-label-sm text-outline">Kosong</span>
                </div>
              )}
            </div>

          </div>

          {/* Leaderboard List (Rank 4+) */}
          <div className="bg-surface rounded-2xl shadow-[0_4px_16px_rgba(37,99,235,0.04)] border border-outline-variant overflow-hidden flex flex-col text-left mb-lg">
            
            {/* Header */}
            <div className="flex items-center px-md py-3.5 border-b border-outline-variant bg-surface-container-low">
              <div className="w-20 text-center font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Peringkat</div>
              <div className="flex-grow font-label-md text-label-md text-on-surface-variant px-sm font-bold uppercase tracking-wider">Pemain</div>
              <div className="w-24 text-right font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">Skor Tertinggi</div>
            </div>

            {/* List Body */}
            <div className="flex flex-col max-h-[420px] overflow-y-auto divide-y divide-outline-variant/40">
              {listEntries.length === 0 ? (
                <div className="text-center py-xl text-outline font-body-md">
                  Belum ada pemain lain terdaftar di peringkat ini. Jadilah yang pertama!
                </div>
              ) : (
                listEntries.map((entry, index) => {
                  const rank = index + 1;
                  return (
                    <div key={entry.user_id} className="flex items-center px-md py-3 hover:bg-surface-container-low/50 transition-colors">
                      <div className="w-20 text-center font-title-md text-title-md text-on-surface-variant font-semibold">{rank}</div>
                      <div className="flex-grow flex items-center gap-sm px-sm">
                        {renderAvatar(entry, 'w-9 h-9')}
                        <span className="font-body-md text-body-md text-on-surface capitalize font-medium">{entry.username}</span>
                      </div>
                      <div className="w-24 text-right font-label-lg text-label-lg text-primary font-bold">{entry.score.toLocaleString()}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* My Rank Sticky Bottom Bar */}
          <div className="sticky bottom-[80px] md:bottom-md z-40 text-left w-full mt-auto">
            {user ? (
              myRank ? (
                <div className="bg-primary-container text-on-primary-container rounded-2xl shadow-xl border-2 border-primary overflow-hidden flex items-center px-md py-4 transition-all hover:scale-[1.01] duration-300">
                  <div className="w-20 text-center font-headline-lg-mobile text-[24px] font-bold">#{myRank}</div>
                  <div className="flex-grow flex items-center gap-sm px-sm">
                    {renderAvatar({ user_id: user.id, username: profile?.username || 'Saya', avatar_url: profile?.avatar_url || '', score: myBestScore }, 'w-11 h-11 border-2 border-white/40')}
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg font-bold">Peringkat Anda</span>
                      <span className="font-label-sm text-label-sm opacity-80">
                        {myRank <= 3 ? 'Luar biasa! Pertahankan posisi podium Anda!' : 'Hebat! Terus main untuk mengejar peringkat atas!'}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-right font-headline-lg-mobile text-[24px] font-bold">{myBestScore.toLocaleString()}</div>
                </div>
              ) : (
                <div className="bg-surface-container text-on-surface rounded-2xl shadow-lg border border-outline-variant overflow-hidden flex flex-col sm:flex-row justify-between items-center px-lg py-4 gap-md">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[32px] text-outline">emoji_events</span>
                    <div className="flex flex-col text-left">
                      <span className="font-label-lg text-label-lg font-bold">Skor Belum Tercatat</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Mainkan game minimal satu kali untuk mencatatkan peringkat global Anda!</span>
                    </div>
                  </div>
                  <Link 
                    to="/game"
                    className="bg-primary text-on-primary font-label-md px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all shadow-sm cursor-pointer border-b-[3px] border-[#003ea8] active:border-b-0 active:translate-y-[3px]"
                  >
                    Main Sekarang
                  </Link>
                </div>
              )
            ) : (
              <div className="bg-surface-container text-on-surface rounded-2xl shadow-lg border border-outline-variant overflow-hidden flex flex-col sm:flex-row justify-between items-center px-lg py-4 gap-md">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[32px] text-outline">lock</span>
                  <div className="flex flex-col text-left">
                    <span className="font-label-lg text-label-lg font-bold">Pantau Peringkat Anda</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Daftar atau masuk akun untuk mencatat skor terbaik Anda di Papan Peringkat global!</span>
                  </div>
                </div>
                <Link 
                  to="/auth"
                  className="bg-primary text-on-primary font-label-md px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all shadow-sm cursor-pointer border-b-[3px] border-[#003ea8] active:border-b-0 active:translate-y-[3px]"
                >
                  Masuk / Daftar
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
