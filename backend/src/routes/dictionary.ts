import express from 'express';
import { supabase } from '../config/supabase';
import { aiModel } from '../config/gemini';

const router = express.Router();

// Get popular/trending words (random selection from cache)
router.get('/trending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('dictionary')
      .select('*')
      .limit(4);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching trending words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search for a word
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Query parameter q is required' });
    return;
  }

  const lowercaseWord = q.toLowerCase();

  try {
    const { data, error } = await supabase
      .from('dictionary')
      .select('*')
      .eq('word', lowercaseWord)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Kata tidak ditemukan di Kamus KBBI kami.' });
        return;
      }
      throw error;
    }

    // Jika kata ada tapi belum punya contoh kalimat (karena hasil import massal)
    if (data && (!data.example_usage || data.example_usage.trim() === '')) {
      try {
        console.log(`Generating AI sentence for: ${lowercaseWord}`);
        const prompt = `Buatkan 1 kalimat pendek dan natural dalam bahasa Indonesia menggunakan kata "${lowercaseWord}" (makna: ${data.meaning}). Cukup balas dengan kalimatnya saja tanpa tanda kutip.`;
        const result = await aiModel.generateContent(prompt);
        const exampleUsage = result.response.text().trim();
        
        // Simpan kalimat kembali ke Supabase agar tersimpan permanen
        if (exampleUsage) {
          await supabase
            .from('dictionary')
            .update({ example_usage: exampleUsage })
            .eq('id', data.id);
            
          data.example_usage = exampleUsage;
        }
      } catch (aiError) {
        console.error('Failed to generate sentence with AI on dictionary search:', aiError);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Error searching word:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
