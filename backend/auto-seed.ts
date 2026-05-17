import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const totalWordsNeeded = 1000;
const wordsPerBatch = 50;
const totalBatches = Math.ceil(totalWordsNeeded / wordsPerBatch);

const outputFile = 'seed_1000_kata.sql';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log(`Memulai pembuatan ${totalWordsNeeded} kata menggunakan Gemini AI...`);
  console.log('Proses ini akan memakan waktu sekitar 1-2 menit untuk menghindari batasan API.\n');

  // Siapkan file SQL
  fs.writeFileSync(outputFile, '-- Seed data 1000 kata (AI Generated)\nINSERT INTO public.dictionary (word, word_type, meaning, example_usage) VALUES\n');

  let generatedWords = new Set<string>();

  for (let i = 0; i < totalBatches; i++) {
    console.log(`⏳ Batch ${i + 1}/${totalBatches}: Sedang memikirkan kata-kata baru...`);
    
    try {
      const prompt = `Buatkan daftar ${wordsPerBatch} kata dasar bahasa Indonesia (campuran nomina, verba, adjektiva) yang acak dan umum digunakan. 
      PENTING: Jangan gunakan kata yang terlalu aneh.
      WAJIB balas murni dalam format JSON array tanpa markdown:
      [
        {"word": "rumah", "word_type": "Nomina", "meaning": "Bangunan tempat tinggal.", "example_usage": "Ini rumah saya."},
        ...
      ]`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      const wordsArray = JSON.parse(text);
      let sqlValues = [];

      for (const item of wordsArray) {
        if (!generatedWords.has(item.word.toLowerCase())) {
          generatedWords.add(item.word.toLowerCase());
          
          // Bersihkan tanda kutip tunggal agar SQL tidak error
          const word = item.word.replace(/'/g, "''");
          const type = item.word_type.replace(/'/g, "''");
          const meaning = item.meaning.replace(/'/g, "''");
          const usage = item.example_usage.replace(/'/g, "''");

          sqlValues.push(`('${word.toLowerCase()}', '${type}', '${meaning}', '${usage}')`);
        }
      }

      if (sqlValues.length > 0) {
        // Jika ini batch terakhir dan sudah mencapai target, akhiri dengan titik koma, jika tidak beri koma
        const isLastBatch = i === totalBatches - 1;
        const separator = isLastBatch ? ';\n' : ',\n';
        fs.appendFileSync(outputFile, sqlValues.join(',\n') + separator);
      }

      console.log(`✅ Batch ${i + 1} selesai. Total kata terkumpul: ${generatedWords.size}`);
      
      // Tunggu 5 detik agar tidak terkena Rate Limit (15 request per minute free tier)
      if (i < totalBatches - 1) {
        await delay(5000);
      }

    } catch (err) {
      console.error(`❌ Batch ${i + 1} gagal:`, err);
      // Ganti koma dengan titik koma jika error di tengah jalan untuk menutup SQL
      fs.appendFileSync(outputFile, ';\n-- Error occurred, script stopped prematurely.\n');
      break;
    }
  }

  // Bersihkan akhir file jika script berhenti sebelum koma terakhir diubah
  const finalContent = fs.readFileSync(outputFile, 'utf8');
  if (finalContent.endsWith(',\n')) {
    fs.writeFileSync(outputFile, finalContent.slice(0, -2) + ';\n');
  }

  console.log(`\n🎉 SELESAI! Berhasil membuat ${generatedWords.size} kata.`);
  console.log(`Silakan buka file ${outputFile}, salin isinya, dan jalankan di SQL Editor Supabase Anda!`);
}

run();
