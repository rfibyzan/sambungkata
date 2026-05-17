import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ level: 1, words: 0, highScore: 0, gamesPlayed: 0 });

  useEffect(() => {
    if (user) {
      const fetchStats = async () => {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('score, word_count')
          .eq('user_id', user.id);
          
        if (!error && data) {
          const totalWords = data.reduce((sum, session) => sum + (session.word_count || 0), 0);
          const maxScore = data.reduce((max, session) => Math.max(max, session.score || 0), 0);
          const gamesCount = data.length;
          
          const currentLevel = Math.floor(totalWords / 20) + 1;
          setStats({ 
            level: currentLevel, 
            words: totalWords, 
            highScore: maxScore, 
            gamesPlayed: gamesCount 
          });
        }
      };
      fetchStats();
    }
  }, [user]);

  return (
    <>
      {/* Hero Section */}
      <section className="w-full max-w-max-width-content px-margin-mobile md:px-0 mt-lg mb-xl flex flex-col md:flex-row items-center gap-xl">
        <div className="flex-1 flex flex-col gap-md text-center md:text-left">
          <h1 className="font-display-lg text-display-lg text-primary">
            Uji Kosakatamu, Sambung Katanya!
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Tantang dirimu dan teman-teman dalam permainan edukatif yang seru. Perkaya perbendaharaan katamu satu demi satu langkah.
          </p>
          <div className="flex flex-col sm:flex-row gap-sm justify-center md:justify-start mt-sm">
            <Link 
              to="/game" 
              className="bg-primary text-on-primary font-label-md text-label-md px-lg py-3 rounded-xl border-b-[4px] border-[#003ea8] hover:bg-[#003ea8] hover:scale-[1.04] hover:shadow-[0_8px_20px_rgba(0,74,198,0.25)] active:border-b-0 active:translate-y-[4px] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md select-none"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              Play Now
            </Link>
            <Link 
              to="/dictionary" 
              className="bg-secondary-container text-on-secondary-container font-label-md text-label-md px-lg py-3 rounded-xl border-b-[4px] border-[#d98b0b] hover:bg-[#fea619]/90 hover:scale-[1.04] hover:shadow-[0_8px_20px_rgba(254,166,25,0.25)] active:border-b-0 active:translate-y-[4px] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md select-none"
            >
              <span className="material-symbols-outlined">menu_book</span>
              Open Dictionary
            </Link>
          </div>
        </div>
        
        <div className="flex-1 w-full max-w-md aspect-square rounded-xl bg-surface-container-highest shadow-sm relative overflow-hidden flex items-center justify-center border border-outline-variant/30">
          {/* Aesthetic Graphic Placeholder for Word Game */}
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface-container flex items-center justify-center opacity-80">
            <div className="grid grid-cols-3 gap-2 p-4">
              <div className="w-16 h-16 bg-primary text-on-primary rounded-lg flex items-center justify-center font-display-lg shadow-sm">K</div>
              <div className="w-16 h-16 bg-surface text-primary rounded-lg flex items-center justify-center font-display-lg shadow-sm border border-outline-variant/50">A</div>
              <div className="w-16 h-16 bg-surface text-primary rounded-lg flex items-center justify-center font-display-lg shadow-sm border border-outline-variant/50">T</div>
              
              <div className="col-start-3 w-16 h-16 bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center font-display-lg shadow-sm">A</div>
              
              <div className="col-start-3 w-16 h-16 bg-surface text-primary rounded-lg flex items-center justify-center font-display-lg shadow-sm border border-outline-variant/50">K</div>
              <div className="col-start-3 w-16 h-16 bg-surface text-primary rounded-lg flex items-center justify-center font-display-lg shadow-sm border border-outline-variant/50">A</div>
              <div className="col-start-3 w-16 h-16 bg-primary text-on-primary rounded-lg flex items-center justify-center font-display-lg shadow-sm">N</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats & Features (Bento Grid) */}
      <section className="w-full max-w-max-width-content px-margin-mobile md:px-0 mb-xl">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-md text-left md:text-center w-full">Statistik &amp; Cara Main</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md text-left">
          {/* Player Stats */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-[0_4px_12px_rgba(37,99,235,0.06)] border border-outline-variant/20 flex flex-col gap-sm md:col-span-1">
            <div className="flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined">analytics</span>
              <h3 className="font-title-md text-title-md">Statistik Pemain</h3>
            </div>
            
            {!user ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-sm gap-3">
                <span className="material-symbols-outlined text-[48px] text-surface-variant">account_circle</span>
                <p className="font-body-md text-body-md text-on-surface-variant">Buat akun atau login terlebih dahulu untuk menyimpan progres Anda.</p>
                <button onClick={() => navigate('/auth')} className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md hover:bg-primary/90 transition-colors w-full mt-2">
                  Login / Daftar
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-surface-container-low rounded-lg p-xs flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Level</span>
                    <span className="font-headline-lg-mobile text-[22px] text-primary">{stats.level}</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-xs flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Kata</span>
                    <span className="font-headline-lg-mobile text-[22px] text-tertiary">{stats.words}</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-xs flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Skor Terbaik</span>
                    <span className="font-headline-lg-mobile text-[22px] text-secondary-container">{stats.highScore}</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-xs flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Main</span>
                    <span className="font-headline-lg-mobile text-[22px] text-outline">{stats.gamesPlayed}</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-sm">
                  <div className="w-full bg-surface-variant rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-primary to-surface-tint h-2.5 rounded-full" style={{ width: `${(stats.words % 20) * 5}%` }}></div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-right mt-1">{(stats.words % 20) * 5}% menuju Level {stats.level + 1}</p>
                </div>
              </>
            )}
          </div>

          {/* How to Play 1 */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-[0_4px_12px_rgba(37,99,235,0.06)] border border-outline-variant/20 flex flex-col gap-sm">
            <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[28px]">abc</span>
            </div>
            <h3 className="font-title-md text-title-md text-on-surface">1. Temukan Kata Dasar</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Mulai dengan kata yang diberikan. Pikirkan kata benda, kerja, atau sifat dalam Bahasa Indonesia yang baku.
            </p>
          </div>

          {/* How to Play 2 */}
          <div className="bg-surface-container-lowest rounded-xl p-md shadow-[0_4px_12px_rgba(37,99,235,0.06)] border border-outline-variant/20 flex flex-col gap-sm">
            <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[28px]">link</span>
            </div>
            <h3 className="font-title-md text-title-md text-on-surface">2. Sambung Suku Kata</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Gunakan suku kata terakhir dari kata sebelumnya untuk memulai kata baru. Rantai yang panjang mendapat skor lebih tinggi!
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
