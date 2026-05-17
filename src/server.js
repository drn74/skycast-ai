import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import queryRouter from './routes/query.route.js';
import weatherRouter from './routes/weather.route.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Mount routers
app.use('/api/query', queryRouter);
app.use('/api', weatherRouter); // /api/geo and /api/weather/*

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SkyCast AI Orchestrator' });
});

app.listen(PORT, () => {
  console.log(`
  - SkyCast AI Orchestrator (PoC) avviato!
  - Orchestrator: http://localhost:${PORT}/api/query
  - REST API attiva per dati ambientali grezzi.
  `);
});
