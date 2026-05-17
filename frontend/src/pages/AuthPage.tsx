import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
            }
          }
        });
        if (error) throw error;
        
        if (data.user) {
          const { error: insertError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              username: username || email.split('@')[0],
            });
            
          if (insertError) {
             console.error('Failed to create public user record:', insertError);
          }
        }
        
        navigate('/');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan saat autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-max-width-content mx-auto px-margin-mobile md:px-margin-desktop py-md md:py-lg">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-md items-stretch mt-lg">
        
        {/* Left Column: Visual Perks & Graphics (Desktop Only) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-primary to-surface-tint text-on-primary rounded-2xl p-lg flex-col justify-between shadow-lg relative overflow-hidden border border-primary/20 min-h-[500px]">
          {/* Aesthetic Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
            <div className="absolute top-10 left-10 text-[64px] font-bold">A</div>
            <div className="absolute top-32 right-12 text-[48px] font-bold">K</div>
            <div className="absolute bottom-20 left-16 text-[56px] font-bold">T</div>
            <div className="absolute bottom-36 right-20 text-[64px] font-bold">S</div>
          </div>
          
          <div className="flex flex-col gap-md z-10">
            <div className="bg-surface-container-lowest/20 w-fit p-3 rounded-xl backdrop-blur-md">
              <span className="material-symbols-outlined text-[32px] text-on-primary">military_tech</span>
            </div>
            <div>
              <h2 className="font-display-lg text-[28px] leading-tight mb-2">Gabung &amp; Bersaing Bersama Pemain Lain!</h2>
              <p className="font-body-md text-on-primary/80">
                Mainkan Sambung Kata untuk melatih otak, menguji perbendaharaan kata, dan menduduki puncak peringkat!
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-sm z-10 mt-xl">
            <div className="flex items-center gap-sm bg-surface-container-lowest/10 p-sm rounded-xl backdrop-blur-sm border border-white/10">
              <span className="material-symbols-outlined text-secondary-container">save</span>
              <div className="text-left">
                <h4 className="font-label-md text-[14px]">Simpan Progres Game</h4>
                <p className="font-body-sm text-[12px] text-on-primary/75">Skor akhir kamu langsung tersimpan secara permanen.</p>
              </div>
            </div>

            <div className="flex items-center gap-sm bg-surface-container-lowest/10 p-sm rounded-xl backdrop-blur-sm border border-white/10">
              <span className="material-symbols-outlined text-secondary-container">leaderboard</span>
              <div className="text-left">
                <h4 className="font-label-md text-[14px]">Masuk Leaderboard Global</h4>
                <p className="font-body-sm text-[12px] text-on-primary/75">Buktikan kemampuanmu dan bersainglah dengan pemain lain.</p>
              </div>
            </div>

            <div className="flex items-center gap-sm bg-surface-container-lowest/10 p-sm rounded-xl backdrop-blur-sm border border-white/10">
              <span className="material-symbols-outlined text-secondary-container">query_stats</span>
              <div className="text-left">
                <h4 className="font-label-md text-[14px]">Pantau Statistik Lengkap</h4>
                <p className="font-body-sm text-[12px] text-on-primary/75">Lihat level, jumlah kata ditemukan, dan grafik perkembanganmu.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="col-span-12 md:col-span-7 bg-surface-container-lowest rounded-2xl shadow-lg border border-outline-variant p-lg md:p-xl flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col gap-lg">
            <div className="text-left">
              <h1 className="font-display-sm text-display-sm text-primary mb-2">
                {isLogin ? 'Selamat Datang Kembali!' : 'Buat Akun Baru'}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {isLogin ? 'Masuk untuk mengaktifkan pelacak statistik progres.' : 'Daftar sekarang untuk menduduki Leaderboard.'}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-error-container text-on-error-container p-sm rounded-lg text-body-sm font-body-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              {!isLogin && (
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface">Username</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[22px]">person</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-surface border-2 border-outline-variant/60 rounded-xl font-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container/20 transition-all shadow-sm"
                      placeholder="PemainHebat123"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[22px]">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface border-2 border-outline-variant/60 rounded-xl font-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container/20 transition-all shadow-sm"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[22px]">lock</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface border-2 border-outline-variant/60 rounded-xl font-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container/20 transition-all shadow-sm"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-primary hover:bg-[#003ea8] text-on-primary font-title-md text-title-md py-3 rounded-xl border-b-4 border-[#003ea8] active:border-b-0 active:translate-y-[4px] disabled:shadow-none disabled:active:translate-y-0 transition-all flex justify-center items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>{isLogin ? 'Masuk ke Akun' : 'Daftar Sekarang'}</span>
                    <span className="material-symbols-outlined">login</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-sm">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrorMsg('');
                  }}
                  className="text-primary font-label-md font-bold hover:underline cursor-pointer"
                >
                  {isLogin ? 'Daftar di sini' : 'Login di sini'}
                </button>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
