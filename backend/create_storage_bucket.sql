-- ==============================================================
-- SQL POLICY UNTUK BUCKET STORAGE "avatars" DI SUPABASE
-- JALANKAN SQL INI DI SQL EDITOR DASHBOARD SUPABASE ANDA
-- ==============================================================

-- Hapus kebijakan lama jika ada untuk menghindari konflik
DROP POLICY IF EXISTS "Akses Publik Untuk Melihat Avatar" ON storage.objects;
DROP POLICY IF EXISTS "Pengguna Terotentikasi Bisa Unggah Avatar" ON storage.objects;
DROP POLICY IF EXISTS "Pengguna Terotentikasi Bisa Update Avatar Sendiri" ON storage.objects;

-- 1. Kebijakan: Siapa saja (Anonim/Publik) bisa melihat file di bucket 'avatars'
CREATE POLICY "Akses Publik Untuk Melihat Avatar" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'avatars');

-- 2. Kebijakan: Pengguna terdaftar bisa mengunggah file ke bucket 'avatars'
CREATE POLICY "Pengguna Terotentikasi Bisa Unggah Avatar" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

-- 3. Kebijakan: Pengguna terdaftar bisa memperbarui file milik mereka di bucket 'avatars'
CREATE POLICY "Pengguna Terotentikasi Bisa Update Avatar Sendiri" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );
