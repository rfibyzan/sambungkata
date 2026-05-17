import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import gameRoutes from './routes/game';
import dictionaryRoutes from './routes/dictionary';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/game', gameRoutes);
app.use('/api/dictionary', dictionaryRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SambungKata API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
