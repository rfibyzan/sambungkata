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
        // Fallback: Use Gemini AI to check if it's a valid Indonesian word and define it on the fly!
        try {
          console.log(`Word not found in DB. Asking Gemini for: ${lowercaseWord}`);
          const prompt = `Apakah "${lowercaseWord}" adalah kata tunggal baku dalam bahasa Indonesia? Jawab dengan format JSON murni tanpa markdown: {"valid": true/false, "word_type": "Verba/Nomina/Adjektiva/Adverbia/dll", "meaning": "Deskripsi singkat makna kata", "example_usage": "1 kalimat pendek dan natural menggunakan kata tersebut"}`;
          const result = await aiModel.generateContent(prompt);
          let aiText = result.response.text().trim();

          // Extract JSON
          const jsonMatch = aiText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiText = jsonMatch[0];
          }

          const aiData = JSON.parse(aiText);

          if (aiData && aiData.valid === true && aiData.meaning) {
            const cleanMeaning = aiData.meaning.replace(/<[^>]*>?/gm, '');

            // Auto-insert into database
            const { data: newWordData, error: insertError } = await supabase
              .from('dictionary')
              .insert({
                word: lowercaseWord,
                word_type: aiData.word_type || 'Kata',
                meaning: cleanMeaning,
                example_usage: aiData.example_usage || 'Contoh kalimat tidak tersedia.',
                search_count: 1
              })
              .select()
              .single();

            if (!insertError && newWordData) {
              console.log(`Automatically added newly defined word to dictionary: ${lowercaseWord}`);
              res.json(newWordData);
              return;
            }
          }
        } catch (aiErr) {
          console.error('Failed to generate on-the-fly dictionary definition:', aiErr);
        }

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

    res.json(data);
  } catch (error) {
    console.error('Error searching word:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate or retrieve example usage for a word (Lazy Load)
router.get('/example', async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Query parameter q is required' });
    return;
  }

  const lowercaseWord = q.toLowerCase().trim();

  try {
    const { data, error } = await supabase
      .from('dictionary')
      .select('*')
      .eq('word', lowercaseWord)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Kata tidak ditemukan.' });
      return;
    }

    if (data.example_usage && data.example_usage.trim() !== '') {
      res.json({ example_usage: data.example_usage });
      return;
    }

    // Generate example sentence using Gemini
    console.log(`Generating AI sentence for lazy load: ${lowercaseWord}`);
    const prompt = `Buatkan 1 kalimat pendek, sederhana, dan natural dalam bahasa Indonesia menggunakan kata "${lowercaseWord}" (makna: ${data.meaning}). Cukup balas dengan kalimatnya saja tanpa tanda kutip.`;
    const result = await aiModel.generateContent(prompt);
    const exampleUsage = result.response.text().trim();

    if (exampleUsage) {
      await supabase
        .from('dictionary')
        .update({ example_usage: exampleUsage })
        .eq('id', data.id);

      res.json({ example_usage: exampleUsage });
    } else {
      res.status(500).json({ error: 'Gagal membuat contoh kalimat.' });
    }
  } catch (error) {
    console.error('Error generating example usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
