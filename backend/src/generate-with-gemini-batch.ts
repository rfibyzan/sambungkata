import { supabase } from './config/supabase';
import { genAI } from './config/gemini';
import dotenv from 'dotenv';

dotenv.config();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithGeminiBatch() {
  console.log('========================================================================');
  console.log('🚀 MEMULAI BATCH GENERASI CONTOH KALIMAT DENGAN GEMINI 1.5 FLASH 🚀');
  console.log('========================================================================');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('\n❌ ERROR: Kunci API Gemini (GEMINI_API_KEY) tidak ditemukan di file .env!');
    return;
  }

  // Gunakan Gemini 1.5 Flash dengan JSON Mode diaktifkan
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: { responseMimeType: 'application/json' }
  });

  try {
    // 1. Dapatkan kata yang belum memiliki contoh kalimat
    console.log('🔍 Memindai database untuk kata-kata yang belum memiliki contoh kalimat...');

    const allMissingWords: any[] = [];
    let start = 0;
    const pageSize = 1000;
    let hasMore = true;
    const TARGET_LIMIT = 25000; // Batas total kata yang diproses per eksekusi skrip

    while (hasMore && allMissingWords.length < TARGET_LIMIT) {
      const { data, error } = await supabase
        .from('dictionary')
        .select('id, word, meaning, example_usage')
        .range(start, start + pageSize - 1);

      if (error) throw error;

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      const missing = data.filter(row => !row.example_usage || row.example_usage.trim() === '');
      allMissingWords.push(...missing);

      start += pageSize;
      process.stdout.write(`\r   👉 Memindai ${start} baris... Menemukan ${allMissingWords.length} kata kosong.`);

      if (data.length < pageSize) {
        hasMore = false;
      }
    }

    console.log('\n\n✅ Pemindaian database selesai.');

    const totalAvailable = allMissingWords.length;
    if (totalAvailable === 0) {
      console.log('🎉 SEMUA KATA DI DATABASE SUDAH MEMILIKI CONTOH KALIMAT!');
      return;
    }

    console.log(`- Jumlah kata tanpa contoh kalimat: ${totalAvailable} kata.`);

    // KONFIGURASI BATCH
    const CHUNK_SIZE = 100; // Jumlah kata per request (100 kata sangat efisien untuk Gemini 1.5 Flash)
    const targetWords = allMissingWords.slice(0, TARGET_LIMIT);
    const totalChunks = Math.ceil(targetWords.length / CHUNK_SIZE);

    console.log(`🚀 Memulai pemrosesan ${targetWords.length} kata dalam ${totalChunks} Batch...`);
    console.log(`ℹ️ Catatan: Menggunakan jeda 4.5 detik antar batch untuk mematuhi Rate Limit Gemini (15 RPM).`);
    console.log('========================================================================\n');

    let totalSuccess = 0;

    for (let startIdx = 0; startIdx < targetWords.length; startIdx += CHUNK_SIZE) {
      const chunk = targetWords.slice(startIdx, startIdx + CHUNK_SIZE);
      const chunkNum = Math.floor(startIdx / CHUNK_SIZE) + 1;

      console.log(`[Batch ${chunkNum}/${totalChunks}] Mengirim ${chunk.length} kata ke Gemini...`);

      // Susun prompt dengan ringkasan arti agar hemat token
      const wordsListText = chunk.map((w, idx) => {
        const shortMeaning = w.meaning.split(';')[0].split(':')[0].slice(0, 60).trim();
        return `${idx + 1}. "${w.word}": ${shortMeaning}`;
      }).join('\n');

      const prompt = `Berikut adalah daftar kata bahasa Indonesia beserta artinya. Buatkan 1 contoh kalimat pendek (berisi maksimal 5-8 kata), sederhana, dan natural dalam bahasa Indonesia untuk masing-masing kata tersebut.
Kembalikan hasilnya HANYA dalam format JSON objek murni (tanpa tag markdown seperti \`\`\`json), dengan format kunci berupa kata (lowercase) dan nilai berupa kalimat contohnya:
{
  "kata1": "Contoh kalimat pendek untuk kata1.",
  "kata2": "Contoh kalimat pendek untuk kata2."
}

Daftar kata:
${wordsListText}`;

      try {
        const result = await model.generateContent(prompt);
        let aiText = result.response.text().trim();

        // Bersihkan tag markdown jika Gemini menyertakannya secara tidak sengaja
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiText = jsonMatch[0];
        }

        const sentencesMap = JSON.parse(aiText);
        let successCount = 0;

        // Update database secara paralel (chunked) untuk kecepatan optimal
        const updatePromises = chunk.map(async (row) => {
          const lowercaseWord = row.word.toLowerCase();
          const sentence = sentencesMap[lowercaseWord] || sentencesMap[row.word];

          if (sentence && sentence.trim() !== '') {
            const { error: updateError } = await supabase
              .from('dictionary')
              .update({ example_usage: sentence.trim() })
              .eq('id', row.id);

            if (!updateError) {
              successCount++;
            } else {
              console.error(`   ❌ Gagal mengupdate "${row.word}":`, updateError.message);
            }
          }
        });

        await Promise.all(updatePromises);
        totalSuccess += successCount;

        const overallPercentage = ((totalSuccess / targetWords.length) * 100).toFixed(1);
        console.log(`   ✅ SUKSES: ${successCount}/${chunk.length} kata di batch ini berhasil diperbarui.`);
        console.log(`   📊 Total Progres: ${totalSuccess}/${targetWords.length} kata (${overallPercentage}% selesai)\n`);

      } catch (chunkErr: any) {
        console.error(`   ❌ GAGAL memproses Batch ${chunkNum}:`, chunkErr.message || chunkErr);
      }

      // Jeda 4.5 detik antar batch untuk menghindari rate limit
      if (startIdx + CHUNK_SIZE < targetWords.length) {
        await delay(4500);
      }
    }

    console.log('========================================================================');
    console.log(`🎉 PROSES GENERASI SELESAI! Berhasil mengimpor ${totalSuccess} kalimat.`);
    console.log('========================================================================');

  } catch (err: any) {
    console.error('❌ Terjadi kesalahan fatal:', err.message || err);
  }
}

generateWithGeminiBatch();
