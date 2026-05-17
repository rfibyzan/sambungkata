-- Seed data untuk tabel kamus (Dictionary)
-- Jalankan kode ini di SQL Editor Supabase Anda untuk memasukkan kosakata dasar.

INSERT INTO public.dictionary (word, word_type, meaning, example_usage) VALUES
('makan', 'Verba', 'Memasukkan makanan ke dalam mulut serta mengunyah dan menelannya.', 'Saya sedang makan nasi goreng di kantin.'),
('minum', 'Verba', 'Memasukkan air atau benda cair ke dalam mulut dan meneguknya.', 'Jangan lupa minum air putih yang banyak.'),
('buku', 'Nomina', 'Lembar kertas yang berjilid, berisi tulisan atau kosong.', 'Buku itu berisi cerita rakyat dari berbagai daerah.'),
('kursi', 'Nomina', 'Tempat duduk yang berkaki dan bersandaran.', 'Ia duduk di kursi goyang sambil membaca koran.'),
('meja', 'Nomina', 'Perabot rumah tangga yang mempunyai bidang datar sebagai daun mejanya dan penyangga.', 'Kopi panas itu diletakkan di atas meja kayu.'),
('jalan', 'Nomina', 'Tempat untuk lalu lintas orang, kendaraan, dan sebagainya.', 'Jalan raya di depan rumah sangat macet di pagi hari.'),
('lari', 'Verba', 'Melangkahkan kaki dengan cepat di mana kedua kaki sempat melayang.', 'Pencuri itu lari terbirit-birit saat dikejar warga.'),
('tidur', 'Verba', 'Dalam keadaan mengistirahatkan badan dan kesadarannya.', 'Ayah tidur pulas setelah lelah bekerja seharian.'),
('pintu', 'Nomina', 'Tempat (lubang) untuk masuk dan keluar.', 'Tolong tutup pintu itu agar nyamuk tidak masuk.'),
('sepatu', 'Nomina', 'Alas kaki yang menutupi bagian ujung, punggung, dan tumit kaki.', 'Ia membeli sepatu baru untuk dipakai berolahraga.'),
('baju', 'Nomina', 'Pakaian penutup badan bagian atas.', 'Ibu membelikan saya baju warna biru.'),
('rumah', 'Nomina', 'Bangunan untuk tempat tinggal.', 'Rumah peninggalan kakek itu terlihat sangat asri.'),
('lampu', 'Nomina', 'Alat untuk menerangi.', 'Tiba-tiba lampu kamar padam karena mati listrik.'),
('mobil', 'Nomina', 'Kendaraan darat yang digerakkan oleh tenaga mesin, beroda empat.', 'Mobil merah itu melaju dengan sangat kencang.'),
('kaca', 'Nomina', 'Benda yang bening dan tembus pandang.', 'Kaca jendela itu pecah terkena lemparan bola.'),
('awan', 'Nomina', 'Kelompok butir air atau es yang tampak mengelompok di atmosfer.', 'Awan mendung mulai terlihat menyelimuti langit.'),
('baca', 'Verba', 'Melihat serta memahami isi dari apa yang tertulis.', 'Setiap malam ia selalu membaca novel kesukaannya.'),
('tulis', 'Verba', 'Membuat huruf, angka, atau tanda dengan pena.', 'Tolong tulis namamu di lembar kertas ini.'),
('langit', 'Nomina', 'Ruang luas yang terbentang di atas bumi.', 'Langit hari ini sangat biru tanpa ada awan sedikit pun.'),
('bumi', 'Nomina', 'Tempat manusia hidup; dunia.', 'Kita harus menjaga kelestarian alam di bumi ini.')
ON CONFLICT (word) DO NOTHING;
