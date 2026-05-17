import { supabase } from './src/config/supabase';

async function importKBBI() {
  console.log('⬇️ Mengunduh database KBBI dari GitHub (ini mungkin memakan waktu beberapa saat)...');
  
  try {
    const response = await fetch('https://raw.githubusercontent.com/dyazincahya/KBBI-SQL-database/master/dictionary_JSON.json');
    if (!response.ok) throw new Error('Gagal mengunduh data');
    
    const rawData = await response.json();
    const words = rawData.dictionary;
    
    console.log(`✅ Berhasil mengunduh ${words.length} kata. Memulai proses pembersihan dan impor ke Supabase...`);
    
    // Kita akan membagi ke dalam batch (500 kata per insert) agar Supabase tidak kewalahan
    const BATCH_SIZE = 500;
    let successCount = 0;
    
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, i + BATCH_SIZE);
      const cleanBatch = [];
      
      for (const item of batch) {
        if (!item.word || !item.arti) continue;
        
        // Membersihkan spasi berlebih
        const cleanWord = item.word.trim().toLowerCase();
        
        // Membersihkan entitas HTML (seperti &lt;b&gt;) menjadi teks biasa
        let cleanMeaning = item.arti
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/<[^>]*>?/gm, '') // Hapus semua tag HTML
          .replace(/&quot;/g, '"')
          .trim();
          
        cleanBatch.push({
          word: cleanWord,
          word_type: 'Kata', // Database ini mencampur tipe di dalam arti, kita beri default
          meaning: cleanMeaning,
          example_usage: '' // Dikosongkan, nanti AI (Gemini) akan mengisi ini jika diminta
        });
      }
      
      // Masukkan ke Supabase
      const { error } = await supabase
        .from('dictionary')
        .upsert(cleanBatch, { onConflict: 'word', ignoreDuplicates: true });
        
      if (error) {
        console.error(`❌ Gagal memasukkan batch ${i} - ${i + BATCH_SIZE}:`, error.message);
      } else {
        successCount += cleanBatch.length;
        process.stdout.write(`\r🚀 Progres: ${successCount} / ${words.length} kata berhasil diimpor...`);
      }
    }
    
    console.log('\n\n🎉 SELESAI! Database KBBI raksasa berhasil dimasukkan ke Supabase Anda.');
    
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error);
  }
}

importKBBI();
