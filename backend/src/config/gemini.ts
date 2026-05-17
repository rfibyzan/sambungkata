import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('⚠️ Gemini API Key not found. AI sentence generation will fail.');
}

export const genAI = new GoogleGenerativeAI(apiKey);
export const aiModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
