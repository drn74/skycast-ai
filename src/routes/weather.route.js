import { Router } from 'express';
import { getCoordinates } from '../services/geoService.js';
import { getWeatherForecast, getHistoricalClimatology, getAirQuality, getMarineData } from '../services/weatherService.js';

const router = Router();

function parseCoords(lat, lon) {
  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)
    throw new Error('Parametro "lat" non valido (range: -90 a 90).');
  if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180)
    throw new Error('Parametro "lon" non valido (range: -180 a 180).');
  return { lat: parsedLat, lon: parsedLon };
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function parseDate(value, fieldName) {
  if (!value || !DATE_REGEX.test(value))
    throw new Error(`Parametro "${fieldName}" non valido. Formato atteso: YYYY-MM-DD.`);
  return value;
}

/**
 * --- RAW DATA ENDPOINTS (REST) ---
 */

// Geocoding: /api/geo?location=Genova
router.get('/geo', async (req, res) => {
  const { location } = req.query;
  if (!location) return res.status(400).json({ error: 'Parametro "location" mancante.' });
  
  try {
    const data = await getCoordinates(location);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forecast: /api/weather/forecast?lat=44.4&lon=8.9
router.get('/weather/forecast', async (req, res) => {
  try {
    const { lat, lon } = parseCoords(req.query.lat, req.query.lon);
    const data = await getWeatherForecast(lat, lon);
    res.json(data);
  } catch (error) {
    res.status(error.message.includes('Parametro') ? 400 : 500).json({ error: error.message });
  }
});

// History: /api/weather/history?lat=44.4&lon=8.9&start=2020-01-01&end=2020-01-07
router.get('/weather/history', async (req, res) => {
  try {
    const { lat, lon } = parseCoords(req.query.lat, req.query.lon);
    const start = parseDate(req.query.start, 'start');
    const end   = parseDate(req.query.end,   'end');
    const data = await getHistoricalClimatology(lat, lon, start, end);
    res.json(data);
  } catch (error) {
    res.status(error.message.includes('Parametro') ? 400 : 500).json({ error: error.message });
  }
});

// Air Quality: /api/weather/air-quality?lat=44.4&lon=8.9
router.get('/weather/air-quality', async (req, res) => {
  try {
    const { lat, lon } = parseCoords(req.query.lat, req.query.lon);
    const data = await getAirQuality(lat, lon);
    res.json(data);
  } catch (error) {
    res.status(error.message.includes('Parametro') ? 400 : 500).json({ error: error.message });
  }
});

// Marine: /api/weather/marine?lat=44.4&lon=8.9
router.get('/weather/marine', async (req, res) => {
  try {
    const { lat, lon } = parseCoords(req.query.lat, req.query.lon);
    const data = await getMarineData(lat, lon);
    res.json(data);
  } catch (error) {
    res.status(error.message.includes('Parametro') ? 400 : 500).json({ error: error.message });
  }
});

export default router;
