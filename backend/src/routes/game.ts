import { Router, Request, Response } from 'express';
import { validateWordInKBBI } from '../services/kbbi';

const router = Router();

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
