import express from 'express';
import { supabase } from '../config/supabase';
import { aiModel } from '../config/gemini';

const router = express.Router();

// Get popular/trending words (dynamic popular searches)
router.get('/trending', async (req, res) => {
  try {
    // 1. Get words with search_count > 0, ordered by search_count DESC
    const { data: popularData, error: popularError } = await supabase
      .from('dictionary')
      .select('*')
      .gt('search_count', 0)
      .order('search_count', { ascending: false })
      .limit(4);

    if (popularError) throw popularError;

    // Curated list of popular fallback words
    const curatedWords = [
      'aksara',
      'bahasa',
      'saujana',
      'lentera',
      'kembara',
      'pustaka',
      'harmoni',
      'cakrawala'
    ];

    let resultData = popularData || [];

    // 2. If we have less than 4 popular words, fill with curated words
    if (resultData.length < 4) {
      const needed = 4 - resultData.length;
      const existingWords = resultData.map(r => r.word);
      const remainingCurated = curatedWords.filter(w => !existingWords.includes(w));
      const shuffledCurated = remainingCurated.sort(() => 0.5 - Math.random()).slice(0, needed);

      if (shuffledCurated.length > 0) {
        const { data: curatedDbData, error: curatedError } = await supabase
          .from('dictionary')
          .select('*')
          .in('word', shuffledCurated);

        if (!curatedError && curatedDbData) {
          resultData = [...resultData, ...curatedDbData];
        }
      }
    }

    // 3. Last fallback if still empty (just in case)
    if (resultData.length === 0) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('dictionary')
        .select('*')
        .limit(4);
      if (fallbackError) throw fallbackError;
      res.json(fallbackData);
      return;
    }

    res.json(resultData.slice(0, 4));
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

    if (data) {
      // Increment search_count in background (asynchronously)
      supabase
        .from('dictionary')
        .update({ search_count: (data.search_count || 0) + 1 })
        .eq('id', data.id)
        .then(({ error: updateError }) => {
          if (updateError) console.error('Failed to increment search count:', updateError);
        });
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
