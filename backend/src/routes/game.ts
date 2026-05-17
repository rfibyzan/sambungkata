import { Router, Request, Response } from 'express';
import { validateWordInKBBI } from '../services/kbbi';
import { supabase } from '../config/supabase';

const router = Router();

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
        return res.json({ word: data.word });
      }
    }

    // Fallback if no count or db error
    const curatedFallbacks = ['aksara', 'bahasa', 'saujana', 'lentera', 'kembara', 'pustaka', 'harmoni', 'cakrawala'];
    const fallback = curatedFallbacks[Math.floor(Math.random() * curatedFallbacks.length)];
    return res.json({ word: fallback });
  } catch (error) {
    console.error('Error fetching random word:', error);
    const curatedFallbacks = ['aksara', 'bahasa', 'saujana', 'lentera', 'kembara', 'pustaka', 'harmoni', 'cakrawala'];
    const fallback = curatedFallbacks[Math.floor(Math.random() * curatedFallbacks.length)];
    return res.json({ word: fallback });
  }
});

router.post('/validate-word', async (req: Request, res: Response): Promise<any> => {
  const { word } = req.body;

  if (!word || typeof word !== 'string') {
    return res.status(400).json({ valid: false, message: 'Word is required' });
  }

  try {
    const isValid = await validateWordInKBBI(word);
    return res.json({ valid: isValid, word });
  } catch (error) {
    return res.status(500).json({ valid: false, message: 'Error validating word' });
  }
});

export default router;
