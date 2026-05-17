import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

// Get popular/trending words (random selection from cache)
router.get('/trending', async (req, res) => {
  try {
    // Basic random sampling using Postgres limit
    // In production, we'd use a real popularity counter or proper RPC random function
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
      // If no rows, return 404
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Word not found in dictionary cache. Play the word in game to cache it.' });
        return;
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error searching word:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
