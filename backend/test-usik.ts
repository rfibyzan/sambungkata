import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const aiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
    const validationPrompt = `Apakah "usik" adalah kata baku dalam bahasa Indonesia? Jawab dengan format JSON murni tanpa markdown: {"valid": true/false, "tipe": "Verba/Nomina/dll", "makna": "Deskripsi singkat"}`;
    const validationResult = await aiModel.generateContent(validationPrompt);
    console.log("Raw output:", validationResult.response.text());
}
run();
