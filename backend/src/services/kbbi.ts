import { supabase } from '../config/supabase';
import { aiModel } from '../config/gemini';

export const validateWordInKBBI = async (word: string): Promise<boolean> => {
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

    // 4. Generate Example Sentence using Gemini AI
    let exampleUsage = '';
    try {
      const prompt = `Buatkan 1 kalimat pendek dan natural dalam bahasa Indonesia menggunakan kata "${lowercaseWord}" (makna: ${meaning}). Cukup balas dengan kalimatnya saja tanpa tanda kutip.`;
      const result = await aiModel.generateContent(prompt);
      exampleUsage = result.response.text().trim();
    } catch (aiError) {
      console.error('Failed to generate sentence with AI:', aiError);
      exampleUsage = 'Contoh kalimat tidak tersedia.'; // Fallback if AI fails
    }

    // 5. Save to Supabase for future use
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
  } catch (error) {
    console.error('Validation Error:', error);
    return false;
  }
};
