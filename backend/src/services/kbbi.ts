import { supabase } from '../config/supabase';
import { aiModel } from '../config/gemini';

export const validateWordInKBBI = async (word: string): Promise<boolean> => {
  const lowercaseWord = word.toLowerCase();

  try {
    // 1. Check Supabase First (Fast Cache)
    const { data: existingWord, error: dbError } = await supabase
      .from('dictionary')
      .select('word')
      .eq('word', lowercaseWord)
      .single();

    if (existingWord) {
      return true;
    }

    // 2. Not found in Supabase, query Kateglo API
    const response = await fetch(`https://kateglo.com/api.php?format=json&phrase=${lowercaseWord}`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    
    // Check if the word is valid in Kateglo
    if (data && data.kateglo && data.kateglo.lex_class) {
      const lexClass = data.kateglo.lex_className || data.kateglo.lex_class;
      let meaning = data.kateglo.definition?.[0]?.def_text || 'Tidak ada makna khusus';
      
      // Clean up meaning (Kateglo sometimes returns HTML tags)
      meaning = meaning.replace(/<[^>]*>?/gm, '');

      // 3. Generate Example Sentence using Gemini AI
      let exampleUsage = '';
      try {
        const prompt = `Buatkan 1 kalimat pendek dan natural dalam bahasa Indonesia menggunakan kata "${lowercaseWord}" (makna: ${meaning}). Cukup balas dengan kalimatnya saja tanpa tanda kutip.`;
        const result = await aiModel.generateContent(prompt);
        exampleUsage = result.response.text().trim();
      } catch (aiError) {
        console.error('Failed to generate sentence with AI:', aiError);
        exampleUsage = ''; // Fallback if AI fails
      }

      // 4. Save to Supabase for future use
      if (exampleUsage) {
        const { error: insertError } = await supabase
          .from('dictionary')
          .insert({
            word: lowercaseWord,
            word_type: lexClass,
            meaning: meaning,
            example_usage: exampleUsage
          });
          
        if (insertError) {
          console.error('Failed to cache word in Supabase:', insertError);
        } else {
          console.log(`Saved new word to dictionary: ${lowercaseWord}`);
        }
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Validation Error:', error);
    return false;
  }
};
