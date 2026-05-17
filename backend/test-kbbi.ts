import { validateWordInKBBI } from './src/services/kbbi';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
  console.log('Testing "usik"...');
  try {
    const result = await validateWordInKBBI('usik');
    console.log('Result:', result);
  } catch (err) {
    console.error('Unhandled Error:', err);
  }
}

test();
