import { supabase } from '../config/supabase';
import { aiModel } from '../config/gemini';

export const validateWordInKBBI = async (word: string): Promise<boolean> => {
  // Instantly reject if the input contains spaces (phrases/sentences are not valid dictionary entries)
  if (/\s/.test(word.trim())) {
    return false;
  }

  const lowercaseWord = word.toLowerCase();

  try {
    // 1. Check Supabase First (Fast Cache)
    const { data: existingWord } = await supabase
      .from('dictionary')
      .select('word')
      .eq('word', lowercaseWord)
      .single();

    if (existingWord) {
      return true;
    }

    // 2. Query Kateglo API
    let isValid = false;
    let lexClass = 'Kata';
    let meaning = '';

    try {
      const response = await fetch(`https://kateglo.com/api.php?format=json&phrase=${lowercaseWord}`);
      const textResponse = await response.text();

      // Check if response is actually JSON and not HTML (Kateglo might return HTML errors)
      if (response.ok && textResponse.startsWith('{')) {
        const data = JSON.parse(textResponse);
        if (data && data.kateglo && data.kateglo.lex_class) {
          isValid = true;
          lexClass = data.kateglo.lex_className || data.kateglo.lex_class;
          meaning = data.kateglo.definition?.[0]?.def_text || 'Tidak ada makna khusus';
          meaning = meaning.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
        }
      }
    } catch (apiError) {
      console.warn('Kateglo API error, falling back to Gemini:', apiError);
    }

    // 3. Fallback to Gemini API if Kateglo fails or returns HTML
    if (!isValid) {
      try {
        const validationPrompt = `Apakah "${lowercaseWord}" adalah kata baku dalam bahasa Indonesia? Jawab dengan format JSON murni tanpa markdown: {"valid": true/false, "tipe": "Verba/Nomina/dll", "makna": "Deskripsi singkat"}`;
        const validationResult = await aiModel.generateContent(validationPrompt);
        let aiText = validationResult.response.text().trim();
        // Extract JSON using regex to handle variations of markdown block
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiText = jsonMatch[0];
        }

        const aiData = JSON.parse(aiText);

        if (aiData && aiData.valid === true) {
          isValid = true;
          lexClass = aiData.tipe || 'Kata';
          meaning = aiData.makna || 'Makna menurut AI';
        }
      } catch (geminiError) {
        console.error('Gemini Validation Error:', geminiError);
        return false;
      }
    }

    if (!isValid) return false;

    // 4. Save to Supabase immediately with empty example_usage (Caching word definition)
    const { error: insertError } = await supabase
      .from('dictionary')
      .insert({
        word: lowercaseWord,
        word_type: lexClass,
        meaning: meaning,
        example_usage: '' // Empty first, will be updated in background
      });

    if (insertError) {
      console.error('Failed to cache word in Supabase:', insertError.message);
    } else {
      console.log(`Cached new word in Supabase (definitions only): ${lowercaseWord}`);

      // 5. Trigger AI Example Generation in the background asynchronously!
      // This will NOT block the return statement, returning true instantly.
      generateAndSaveExampleInBackground(lowercaseWord, meaning);
    }

    return true;
  } catch (error) {
    console.error('Validation Error:', error);
    return false;
  }
};

// Helper function to generate example sentence in the background
async function generateAndSaveExampleInBackground(word: string, meaning: string) {
  try {
    console.log(`[Background] Generating AI sentence for: ${word}`);
    const prompt = `Buatkan 1 kalimat pendek, sederhana, dan natural dalam bahasa Indonesia menggunakan kata "${word}" (makna: ${meaning}). Cukup balas dengan kalimatnya saja tanpa tanda kutip.`;
    const result = await aiModel.generateContent(prompt);
    const exampleUsage = result.response.text().trim();

    if (exampleUsage) {
      const { error: updateError } = await supabase
        .from('dictionary')
        .update({ example_usage: exampleUsage })
        .eq('word', word);

      if (updateError) {
        console.error(`[Background] Failed to save example sentence for "${word}":`, updateError.message);
      } else {
        console.log(`[Background] Saved example sentence for "${word}": "${exampleUsage}"`);
      }
    }
  } catch (error) {
    console.error(`[Background] Error generating sentence for "${word}":`, error);
  }
}
