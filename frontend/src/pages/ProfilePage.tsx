import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import CroppedAvatar from '../components/CroppedAvatar';

export default function ProfilePage() {
  const { user, signOut, refreshProfile, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Avatar Editor Modal States (URL option removed per request)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<'preset' | 'upload'>('preset');

  // Isolated draft states for modal to support instant editing preview without DB spamming
  const [modalPresetStyle, setModalPresetStyle] = useState('adventurer');
  const [modalPresetSeed, setModalPresetSeed] = useState('');
  const [modalUploadedUrl, setModalUploadedUrl] = useState('');

  // Cropper specific states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = (croppedArea: Area, _croppedAreaPixels: Area) => {
    setCroppedArea(croppedArea);
  };


  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [stats, setStats] = useState({ level: 1, words: 0, highScore: 0, gamesPlayed: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const [loadingUsername, setLoadingUsername] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Sync profile data when context loaded
  useEffect(() => {
    if (profile?.email) {
      setEmail(profile.email);
    } else if (user) {
      setEmail(user.email || '');
    }
    if (profile) {
      setUsername(profile.username || '');
    }
  }, [profile, user]);

  // Fetch stats on mount
  useEffect(() => {
    if (user) {
      const fetchStats = async () => {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('game_sessions')
          .select('score, word_count')
          .eq('user_id', user.id);

        if (!sessionsError && sessionsData) {
          const totalWords = sessionsData.reduce((sum, s) => sum + (s.word_count || 0), 0);
          const maxScore = sessionsData.reduce((max, s) => Math.max(max, s.score || 0), 0);
          const gamesCount = sessionsData.length;
          const currentLevel = Math.floor(totalWords / 20) + 1;

          setStats({
            level: currentLevel,
            words: totalWords,
            highScore: maxScore,
            gamesPlayed: gamesCount
          });
        }
        setLoadingStats(false);
      };

      fetchStats();
    }
  }, [user]);

  // Open modal and pre-populate draft states from current saved avatar URL
  const openAvatarModal = () => {
    setModalError(null);
    setSelectedImage(null);
    if (profile) {
      const url = profile.avatar_url || '';

      if (url.startsWith('https://api.dicebear.com/7.x/')) {
        setModalSource('preset');
        const match = url.match(/7\.x\/([^/]+)\/svg\?seed=(.+)$/);
        if (match) {
          setModalPresetStyle(match[1]);
          setModalPresetSeed(decodeURIComponent(match[2]));
        }
        setModalUploadedUrl('');
      } else if (url !== '') {
        // Any custom URL or uploaded storage URL goes to upload preview
        setModalSource('upload');
        setModalUploadedUrl(url);
      } else {
        setModalSource('preset');
        setModalPresetStyle('adventurer');
        setModalPresetSeed('');
        setModalUploadedUrl('');
      }
    }
    setIsAvatarModalOpen(true);
  };

  // Dynamic preview calculated for modal in real-time
  const modalPreviewUrl = (() => {
    if (modalSource === 'upload') return selectedImage || modalUploadedUrl;
    return `https://api.dicebear.com/7.x/${modalPresetStyle}/svg?seed=${encodeURIComponent(modalPresetSeed || username || 'default')}`;
  })();

  // Triggered ONLY when clicking "Selesai" button: commits draft to Supabase DB users table
  const handleSaveAvatar = async () => {
    if (!user) return;

    let finalUrl = '';

    if (modalSource === 'preset') {
      finalUrl = `https://api.dicebear.com/7.x/${modalPresetStyle}/svg?seed=${encodeURIComponent(modalPresetSeed || username || 'default')}`;

      setLoadingAvatar(true);
      setModalError(null);

      try {
        const { error } = await supabase
          .from('users')
          .update({ avatar_url: finalUrl })
          .eq('id', user.id);

        if (error) throw error;

        await refreshProfile();
        setIsAvatarModalOpen(false);
        setMsg({ type: 'success', text: 'Gambar profil berhasil diperbarui!' });
      } catch (err: any) {
        setModalError(err.message || 'Gagal menyimpan gambar profil.');
      } finally {
        setLoadingAvatar(false);
      }
    } else if (modalSource === 'upload') {
      if (selectedImage && uploadedFile) {
        if (!croppedArea) {
          setModalError('Silakan sesuaikan pemotongan gambar terlebih dahulu.');
          return;
        }
        setLoadingAvatar(true);
        setModalError(null);
        try {
          // 1. Upload original raw file (no canvas resize, no quality loss) to Supabase Storage
          const fileExt = uploadedFile.name.split('.').pop() || 'png';
          const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, uploadedFile, {
              contentType: uploadedFile.type,
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            if (uploadError.message.includes('bucket') || uploadError.message.includes('does not exist')) {
              throw new Error("Bucket 'avatars' tidak ditemukan di Storage Supabase Anda. Pastikan Anda telah membuat bucket publik bernama 'avatars'.");
            }
            throw uploadError;
          }

          // 2. Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          // 3. Append percentage crop parameters to the URL
          const finalUrl = `${publicUrl}?cx=${croppedArea.x}&cy=${croppedArea.y}&cw=${croppedArea.width}&ch=${croppedArea.height}`;

          // 4. Save original URL + crop query parameters to database users table
          const { error: dbError } = await supabase
            .from('users')
            .update({ avatar_url: finalUrl })
            .eq('id', user.id);

          if (dbError) throw dbError;

          await refreshProfile();
          setIsAvatarModalOpen(false);
          setSelectedImage(null);
          setUploadedFile(null);
          setMsg({ type: 'success', text: 'Gambar profil berhasil diperbarui!' });
        } catch (err: any) {
          console.error(err);
          setModalError(err.message || 'Gagal memproses gambar profil.');
        } finally {
          setLoadingAvatar(false);
        }
      } else {
        if (!modalUploadedUrl) {
          setModalError('Silakan pilih dan unggah file gambar terlebih dahulu.');
          return;
        }

        setLoadingAvatar(true);
        setModalError(null);
        try {
          const { error } = await supabase
            .from('users')
            .update({ avatar_url: modalUploadedUrl })
            .eq('id', user.id);

          if (error) throw error;

          await refreshProfile();
          setIsAvatarModalOpen(false);
          setMsg({ type: 'success', text: 'Gambar profil berhasil diperbarui!' });
        } catch (err: any) {
          setModalError(err.message || 'Gagal menyimpan gambar profil.');
        } finally {
          setLoadingAvatar(false);
        }
      }
    }
  };

  // File picker handler: Reads selected file locally as a base64 Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setModalError('File terlalu besar! Maksimal ukuran adalah 3MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setModalError('File harus berupa gambar!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setUploadedFile(file); // Save the original raw File!
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setModalError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingUsername(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({ username })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      setMsg({ type: 'success', text: 'Username berhasil diperbarui!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal memperbarui username.' });
    } finally {
      setLoadingUsername(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoadingEmail(true);
    setMsg(null);
    try {
      // 1. Update Auth Email
      const { error: authError } = await supabase.auth.updateUser({ email });
      if (authError) throw authError;

      // 2. Force Sync to public users profile table instantly
      const { error: dbError } = await supabase
        .from('users')
        .update({ email })
        .eq('id', user.id);
      if (dbError) throw dbError;

      await refreshProfile();
      setMsg({ type: 'success', text: 'Email berhasil diperbarui secara instan!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal memperbarui email.' });
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (password.length < 6) {
      setMsg({ type: 'error', text: 'Kata sandi baru harus minimal 6 karakter.' });
      return;
    }
    if (password !== confirmPassword) {
      setMsg({ type: 'error', text: 'Kata sandi baru dan konfirmasi kata sandi tidak cocok.' });
      return;
    }
    setLoadingPassword(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirmPassword('');
      setMsg({ type: 'success', text: 'Kata sandi berhasil diperbarui!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal memperbarui kata sandi.' });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-[48px] text-primary">progress_activity</span>
      </div>
    );
  }

  // Fallback avatar letter
  const avatarLetter = (username || email || 'P').charAt(0).toUpperCase();

  return (
    <div className="w-full max-w-max-width-content mx-auto px-margin-mobile md:px-margin-desktop py-md md:py-lg">

      {/* Page Title */}
      <div className="flex justify-between items-center mb-lg">
        <h1 className="font-display-lg text-display-lg text-primary">Profil Pemain</h1>
        <button
          onClick={handleLogout}
          className="bg-error text-on-error px-4 py-2 rounded-xl font-label-md hover:bg-error/90 transition-all flex items-center gap-2 border-b-2 border-b-on-error-container active:border-b-0 active:translate-y-[2px] shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Keluar Akun
        </button>
      </div>

      {msg && (
        <div className={`p-md rounded-xl font-body-md text-body-md mb-lg shadow-sm border ${msg.type === 'success'
            ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/20'
            : 'bg-error-container text-on-error-container border-error/20'
          }`}>
          {msg.text}
        </div>
      )}

      {/* Profile Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-md items-start">

        {/* Left Card: Profile & Stats Overview */}
        <div className="md:col-span-5 flex flex-col gap-md">
          {/* Avatar Profile Box */}
          <div className="bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant shadow-[0_4px_16px_rgba(37,99,235,0.04)] text-center flex flex-col items-center gap-sm relative overflow-hidden">
            <div className="absolute -left-12 -top-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

            {/* Interactive Avatar Circle */}
            <div
              onClick={openAvatarModal}
              className="relative w-36 h-36 rounded-full group cursor-pointer shadow-md border-4 border-white bg-surface overflow-hidden transition-all hover:scale-105 active:scale-95 duration-200"
              title="Klik untuk mengubah foto profil"
            >
              <CroppedAvatar
                src={profile?.avatar_url}
                alt="Avatar Pemain"
                className="w-full h-full group-hover:opacity-70 transition-opacity"
                fallbackLetter={avatarLetter}
                fallbackClassName="text-[54px] font-bold"
              />
              {/* Camera Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 pointer-events-none">
                <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
              </div>
            </div>

            <div>
              <h2 className="font-display-sm text-display-sm text-on-surface capitalize mt-xs">{username || 'Pemain'}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{email}</p>
            </div>
            <div className="font-label-sm text-label-sm text-outline mt-xs bg-surface-container-low px-4 py-1.5 rounded-full">
              Terdaftar sejak: {new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Player Stats Bento Box */}
          <div className="bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant shadow-[0_4px_16px_rgba(37,99,235,0.04)] flex flex-col gap-sm">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <span className="material-symbols-outlined">analytics</span>
              <h3 className="font-title-md text-title-md">Statistik Dinamis</h3>
            </div>

            {loadingStats ? (
              <div className="flex items-center justify-center py-xl">
                <span className="material-symbols-outlined animate-spin text-[32px] text-outline">progress_activity</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface-container-low rounded-lg p-sm flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Level Pemain</span>
                    <span className="font-headline-lg-mobile text-[24px] text-primary">{stats.level}</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-sm flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Kata Ditemukan</span>
                    <span className="font-headline-lg-mobile text-[24px] text-tertiary">{stats.words}</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-sm flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Skor Tertinggi</span>
                    <span className="font-headline-lg-mobile text-[24px] text-secondary-container">{stats.highScore}</span>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-sm flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Total Main</span>
                    <span className="font-headline-lg-mobile text-[24px] text-outline">{stats.gamesPlayed}</span>
                  </div>
                </div>

                <div className="pt-sm mt-sm">
                  <div className="w-full bg-surface-variant rounded-full h-2.5">
                    <div className="bg-linear-to-r from-primary to-surface-tint h-2.5 rounded-full" style={{ width: `${(stats.words % 20) * 5}%` }}></div>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant text-right mt-1">{(stats.words % 20) * 5}% menuju Level {stats.level + 1}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Card: Profile Edit Panel */}
        <div className="md:col-span-7 bg-surface-container-lowest rounded-2xl p-lg md:p-xl border border-outline-variant shadow-[0_4px_16px_rgba(37,99,235,0.04)] flex flex-col gap-lg">
          <div>
            <h3 className="font-display-sm text-display-sm text-on-surface mb-1">Pengaturan Profil</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">Perbarui kredensial dan identitas akun Anda di sini.</p>
          </div>

          <hr className="border-outline-variant/40" />

          {/* Form Username */}
          <form onSubmit={handleUpdateUsername} className="flex flex-col gap-sm">
            <h4 className="font-label-lg text-label-lg text-primary">Ubah Username</h4>
            <div className="flex flex-col sm:flex-row gap-sm items-end">
              <div className="flex-1 flex flex-col gap-1 w-full">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Username Baru</label>
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[22px]">person</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface border-2 border-outline-variant/60 rounded-xl font-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container/20 transition-all shadow-sm"
                    placeholder="Username"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loadingUsername}
                className="bg-primary text-on-primary font-label-md px-6 py-3 rounded-xl border-b-[3px] border-on-primary-fixed-variant hover:bg-on-primary-fixed-variant active:border-b-0 active:translate-y-[3px] transition-all disabled:opacity-50 h-[50px] w-full sm:w-auto flex justify-center items-center gap-1 cursor-pointer shrink-0"
              >
                {loadingUsername ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Simpan
                  </>
                )}
              </button>
            </div>
          </form>

          <hr className="border-outline-variant/40" />

          {/* Form Email */}
          <form onSubmit={handleUpdateEmail} className="flex flex-col gap-sm">
            <h4 className="font-label-lg text-label-lg text-primary">Ubah Alamat Email</h4>
            <div className="flex flex-col sm:flex-row gap-sm items-end">
              <div className="flex-1 flex flex-col gap-1 w-full">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Alamat Email Baru</label>
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[22px]">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface border-2 border-outline-variant/60 rounded-xl font-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container/20 transition-all shadow-sm"
                    placeholder="email@baru.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loadingEmail}
                className="bg-primary text-on-primary font-label-md px-6 py-3 rounded-xl border-b-[3px] border-on-primary-fixed-variant hover:bg-on-primary-fixed-variant active:border-b-0 active:translate-y-[3px] transition-all disabled:opacity-50 h-[50px] w-full sm:w-auto flex justify-center items-center gap-1 cursor-pointer shrink-0"
              >
                {loadingEmail ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Simpan
                  </>
                )}
              </button>
            </div>
          </form>

          <hr className="border-outline-variant/40" />

          {/* Form Password */}
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-sm">
            <h4 className="font-label-lg text-label-lg text-primary">Ubah Kata Sandi</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
              <div className="flex flex-col gap-1 w-full">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Kata Sandi Baru (Min. 6 Karakter)</label>
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[22px]">lock</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface border-2 border-outline-variant/60 rounded-xl font-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container/20 transition-all shadow-sm"
                    placeholder="Kata sandi baru"
                    minLength={6}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-1 w-full">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Ketik Ulang Kata Sandi Baru</label>
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[22px]">lock_reset</span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface border-2 border-outline-variant/60 rounded-xl font-body-lg text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary-container/20 transition-all shadow-sm"
                    placeholder="Ketik ulang kata sandi"
                    minLength={6}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-1">
              <button
                type="submit"
                disabled={loadingPassword}
                className="bg-primary text-on-primary font-label-md px-6 py-3 rounded-xl border-b-[3px] border-on-primary-fixed-variant hover:bg-on-primary-fixed-variant active:border-b-0 active:translate-y-[3px] transition-all disabled:opacity-50 h-[50px] w-full sm:w-auto flex justify-center items-center gap-1 cursor-pointer"
              >
                {loadingPassword ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Perbarui Kata Sandi
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

      </div>

      {/* Modern Avatar Editor Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-[92vw] sm:w-[500px] md:w-[600px] max-w-2xl p-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-md">

            {/* Close Button */}
            <button
              onClick={() => {
                setIsAvatarModalOpen(false);
                setModalError(null);
                setSelectedImage(null);
              }}
              className="absolute right-4 top-4 text-outline hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Tutup modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div>
              <h3 className="font-title-lg text-title-lg text-on-surface">Ubah Gambar Profil</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Pilih preset atau unggah gambar profil baru Anda.</p>
            </div>

            {/* Error Message inside the Modal */}
            {modalError && (
              <div className="bg-error-container text-on-error-container border border-error/20 p-sm rounded-xl font-body-sm text-body-sm mb-xs shadow-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex flex-col items-center gap-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Pratinjau Gambar</span>
              <div className="w-28 h-28 bg-surface rounded-full border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-md relative">
                {modalPreviewUrl ? (
                  <img src={modalPreviewUrl} alt="Pratinjau" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[48px] text-outline-variant">person</span>
                )}
                {loadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="material-symbols-outlined animate-spin text-[32px] text-white">progress_activity</span>
                  </div>
                )}
              </div>
              {loadingAvatar && (
                <span className="font-label-xs text-label-xs text-primary animate-pulse mt-xs">Memproses perubahan...</span>
              )}
            </div>

            {/* Source Select Tabs */}
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/60">
              <button
                onClick={() => setModalSource('preset')}
                className={`flex-1 py-2 text-center rounded-lg font-label-md text-label-md cursor-pointer transition-all ${modalSource === 'preset' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                Preset
              </button>
              <button
                onClick={() => setModalSource('upload')}
                className={`flex-1 py-2 text-center rounded-lg font-label-md text-label-md cursor-pointer transition-all ${modalSource === 'upload' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                Unggah File
              </button>
            </div>

            {/* Content Panel */}
            <div className="min-h-[120px] flex flex-col justify-center">
              {modalSource === 'preset' && (
                <div className="grid grid-cols-1 gap-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-on-surface-variant">Gaya Karakter</label>
                    <select
                      value={modalPresetStyle}
                      onChange={(e) => setModalPresetStyle(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface border-2 border-outline-variant/60 rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="adventurer">Petualang (Adventurer)</option>
                      <option value="bottts">Robot (Bottts)</option>
                      <option value="pixel-art">Retro (Pixel Art)</option>
                      <option value="lorelei">Kartun Imut (Lorelei)</option>
                      <option value="miniavs">Minimalis (Miniavs)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-on-surface-variant">Variasi Teks Seed (Berubah secara Instan!)</label>
                    <input
                      type="text"
                      value={modalPresetSeed}
                      onChange={(e) => setModalPresetSeed(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface border-2 border-outline-variant/60 rounded-xl font-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                      placeholder="Nama kamu, hewan, dll..."
                    />
                  </div>
                </div>
              )}

              {modalSource === 'upload' && (
                <div className="w-full flex flex-col items-center">
                  {!selectedImage ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary/50 hover:bg-primary/5 transition-all p-lg rounded-xl cursor-pointer w-full text-center group">
                      <span className="material-symbols-outlined text-[36px] text-outline group-hover:text-primary transition-colors">upload_file</span>
                      <span className="font-label-md text-label-md text-on-surface mt-xs">Pilih Gambar Dari Perangkat</span>
                      <span className="font-body-xs text-body-xs text-outline mt-1">Maks. 3MB (PNG, JPG, JPEG)</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    /* The Crop and Adjust Workspace */
                    <div className="flex flex-col items-center gap-md w-full">

                      {/* Interactive Viewport Container with react-easy-crop */}
                      <div className="relative w-[280px] h-[280px] rounded-xl overflow-hidden bg-surface-container-high border border-outline-variant">
                        <Cropper
                          image={selectedImage}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          cropShape="round"
                          showGrid={false}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                          minZoom={1}
                          maxZoom={3}
                        />
                      </div>

                      {/* Geser Hint */}
                      <span className="font-body-xs text-body-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">drag_pan</span>
                        Geser gambar untuk menyesuaikan posisi tengah
                      </span>

                      {/* Slider Control for Zoom */}
                      <div className="flex items-center gap-sm w-full max-w-[320px] px-sm mt-xs">
                        <span className="material-symbols-outlined text-outline text-[20px] select-none">zoom_out</span>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.01"
                          value={zoom}
                          onChange={(e) => setZoom(parseFloat(e.target.value))}
                          className="flex-1 accent-primary h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="material-symbols-outlined text-outline text-[20px] select-none">zoom_in</span>
                      </div>

                      {/* Reset Image Selection Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="font-label-sm text-label-sm text-primary hover:text-on-primary-fixed-variant transition-colors flex items-center gap-1 cursor-pointer mt-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                        Pilih Gambar Lain
                      </button>

                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-sm border-t border-outline-variant/40 pt-md mt-sm">
              <button
                type="button"
                onClick={() => {
                  setIsAvatarModalOpen(false);
                  setModalError(null);
                  setSelectedImage(null);
                }}
                className="px-6 py-2.5 rounded-xl font-label-md text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={loadingAvatar}
                className="bg-primary text-on-primary font-label-md px-6 py-2.5 rounded-xl hover:bg-on-primary-fixed-variant transition-all cursor-pointer shadow-sm flex items-center gap-1 disabled:opacity-50"
              >
                {loadingAvatar ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">done</span>
                    Selesai
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
