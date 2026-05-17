-- 1. Tambahkan kolom avatar_url ke tabel public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Pastikan kebijakan UPDATE RLS membolehkan pengguna mengupdate profilnya sendiri
-- Kebijakan ini sudah dibuat sebelumnya, namun untuk memastikannya tetap aktif:
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'users' AND schemaname = 'public'
    ) THEN
        -- Aktifkan RLS
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Buat policy UPDATE jika belum ada
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'users' AND policyname = 'Users can update their own profile.'
        ) THEN
            CREATE POLICY "Users can update their own profile." ON public.users 
                FOR UPDATE USING (auth.uid() = id);
        END IF;
    END IF;
END $$;
