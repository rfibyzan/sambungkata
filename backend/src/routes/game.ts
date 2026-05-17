import { Router, Request, Response } from 'express';
import { validateWordInKBBI } from '../services/kbbi';
import { supabase } from '../config/supabase';

const router = Router();

async function getSuggestedPrefixLength(word: string): Promise<number> {
  if (!word || word.length < 4) return 2;
  const threeCharSuffix = word.slice(-3).toLowerCase();
  
  try {
    const { count, error } = await supabase
      .from('dictionary')
      .select('*', { count: 'exact', head: true })
      .like('word', `${threeCharSuffix}%`);
      
    // Jika ada 10 atau lebih kata di kamus yang berawalan 3 huruf ini, sarankan 3 huruf
    if (!error && count && count >= 10) {
      return 3;
    }
  } catch (err) {
    console.error('Error counting prefix:', err);
  }
  return 2;
}

// Get a random starting word from the dictionary
router.get('/random-word', async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Get the total count of words in the dictionary
    const { count, error: countError } = await supabase
      .from('dictionary')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    if (count && count > 0) {
      // 2. Select a random offset
      const randomIndex = Math.floor(Math.random() * count);
      const { data, error: wordError } = await supabase
        .from('dictionary')
        .select('word')
        .range(randomIndex, randomIndex)
        .single();

      if (!wordError && data && data.word) {
        const length = await getSuggestedPrefixLength(data.word);
        return res.json({ word: data.word, suggestedPrefixLength: length });
      }
    }

    // Fallback if no count or db error
    const curatedFallbacks = ['aksara', 'bahasa', 'saujana', 'lentera', 'kembara', 'pustaka', 'harmoni', 'cakrawala'];
    const fallback = curatedFallbacks[Math.floor(Math.random() * curatedFallbacks.length)];
    const length = await getSuggestedPrefixLength(fallback);
    return res.json({ word: fallback, suggestedPrefixLength: length });
  } catch (error) {
    console.error('Error fetching random word:', error);
    const curatedFallbacks = ['aksara', 'bahasa', 'saujana', 'lentera', 'kembara', 'pustaka', 'harmoni', 'cakrawala'];
    const fallback = curatedFallbacks[Math.floor(Math.random() * curatedFallbacks.length)];
    const length = await getSuggestedPrefixLength(fallback);
    return res.json({ word: fallback, suggestedPrefixLength: length });
  }
});

router.post('/validate-word', async (req: Request, res: Response): Promise<any> => {
  const { word } = req.body;

  if (!word || typeof word !== 'string') {
    return res.status(400).json({ valid: false, message: 'Word is required' });
  }

  try {
    const isValid = await validateWordInKBBI(word);
    if (isValid) {
      const length = await getSuggestedPrefixLength(word);
      return res.json({ valid: true, word, suggestedPrefixLength: length });
    }
    return res.json({ valid: false, word });
  } catch (error) {
    return res.status(500).json({ valid: false, message: 'Error validating word' });
  }
});

export default router;
