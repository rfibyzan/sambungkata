-- 1. Tambahkan kolom search_count ke tabel dictionary jika belum ada
ALTER TABLE public.dictionary ADD COLUMN IF NOT EXISTS search_count INTEGER DEFAULT 0;

-- 2. Berikan izin UPDATE pada RLS jika diaktifkan (agar backend bisa menambah jumlah pencarian)
-- Kebijakan ini memungkinkan update kolom search_count untuk baris mana pun
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'dictionary' AND schemaname = 'public'
    ) THEN
        -- Aktifkan RLS jika belum aktif (opsional, disarankan)
        ALTER TABLE public.dictionary ENABLE ROW LEVEL SECURITY;
        
        -- Hapus kebijakan lama jika ada untuk menghindari konflik
        DROP POLICY IF EXISTS "Dictionary is viewable by everyone" ON public.dictionary;
        DROP POLICY IF EXISTS "Backend can update dictionary search counts" ON public.dictionary;
        
        -- Buat kebijakan baru
        CREATE POLICY "Dictionary is viewable by everyone" ON public.dictionary 
            FOR SELECT USING (true);
            
        CREATE POLICY "Backend can update dictionary search counts" ON public.dictionary 
            FOR UPDATE USING (true);
    END IF;
END $$;
