import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { processWeatherQuery, QuotaExceededError } from '../services/geminiService.js';

const router = Router();

const queryLimiter = rateLimit({
  windowMs: 60 * 1000,       // finestra di 1 minuto
  max: 20,                    // max 20 richieste per IP per finestra
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Troppe richieste. Riprova tra un minuto.',
    retryAfter: 60,
  },
});

function sanitizeUserContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return null;

  const lat = parseFloat(ctx.lat);
  const lon = parseFloat(ctx.lon);

  if (!isNaN(lat) && (lat < -90 || lat > 90)) return null;
  if (!isNaN(lon) && (lon < -180 || lon > 180)) return null;

  return {
    lat: isNaN(lat) ? null : lat,
    lon: isNaN(lon) ? null : lon,
    date: typeof ctx.date === 'string' ? ctx.date.replace(/[^\d\/\-\.a-zA-Z\s]/g, '').slice(0, 30) : null,
  };
}

/**
 * --- ORCHESTRATION ENDPOINT ---
 */
router.post('/', queryLimiter, async (req, res) => {
  const { query, history } = req.body;
  const userContext = sanitizeUserContext(req.body.userContext);

  if (!query) {
    return res.status(400).json({ error: 'La proprietà "query" è obbligatoria nel corpo della richiesta.' });
  }

  const MAX_HISTORY_ITEMS = 20;
  const safeHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_ITEMS) : [];

  console.log(`[Server] Ricevuta query: "${query}" (History length: ${safeHistory.length})`);
  
  try {
    const response = await processWeatherQuery(query, safeHistory, userContext);
    res.json({ response });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return res.status(429).json({
        error: 'Quota exceeded',
        retryAfter: error.retryAfter,
        message: `Soglia di utilizzo raggiunta. Per favore, attendi ${error.retryAfter} secondi prima di riprovare.`,
      });
    }
    console.error('[Server Error]:', error.message);
    res.status(500).json({ error: 'Si è verificato un errore interno al server.' });
  }
});

export default router;
