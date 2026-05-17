import axios from 'axios';
import NodeCache from 'node-cache';

const weatherCache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // TTL 10 minuti

/**
 * Recupera le previsioni meteo attuali e per i prossimi 7 giorni, inclusi dati agricoli, energetici e di salute.
 */
export async function getWeatherForecast(lat, lon) {
  const key = `forecast:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = weatherCache.get(key);
  if (cached) return cached;

  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        current_weather: true,
        hourly: 'relative_humidity_2m,visibility,wind_gusts_10m,freezing_level_height,soil_moisture_0_to_7cm,surface_pressure,apparent_temperature,wind_speed_80m,wind_speed_120m,soil_temperature_0_to_7cm,cloud_cover,is_day,snow_depth',
        daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,precipitation_probability_max,uv_index_max,shortwave_radiation_sum,sunrise,sunset,snowfall_sum',
        timezone: 'auto'
      },
      timeout: 10000
    });
    weatherCache.set(key, response.data);
    return response.data;
  } catch (error) {
    console.error('Errore in WeatherService (Forecast):', error.message);
    throw error;
  }
}

/**
 * Recupera i dati storici (climatologia) per confronti a lungo termine.
 * @param {number} lat
 * @param {number} lon
 * @param {string} startDate - Formato YYYY-MM-DD
 * @param {string} endDate - Formato YYYY-MM-DD
 */
export async function getHistoricalClimatology(lat, lon, startDate, endDate) {
  const key = `archive:${lat.toFixed(2)}:${lon.toFixed(2)}:${startDate}:${endDate}`;
  const cached = weatherCache.get(key);
  if (cached) return cached;

  try {
    const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
      params: {
        latitude: lat,
        longitude: lon,
        start_date: startDate,
        end_date: endDate,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,shortwave_radiation_sum',
        timezone: 'auto'
      },
      timeout: 10000
    });
    weatherCache.set(key, response.data, 3600); // 1 ora per i dati storici
    return response.data;
  } catch (error) {
    console.error('Errore in WeatherService (Archive):', error.message);
    throw error;
  }
}

/**
 * Recupera i dati sulla qualità dell'aria (PM10, PM2.5, Ozono, Biossido di Azoto).
 * @param {number} lat
 * @param {number} lon
 */
export async function getAirQuality(lat, lon) {
  const key = `air:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = weatherCache.get(key);
  if (cached) return cached;

  try {
    const response = await axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'pm10,pm2_5,ozone,nitrogen_dioxide',
        timezone: 'auto'
      },
      timeout: 10000
    });
    weatherCache.set(key, response.data);
    return response.data;
  } catch (error) {
    console.error('Errore in WeatherService (AirQuality):', error.message);
    throw error;
  }
}

/**
 * Recupera i dati marini (altezza onde, temperatura superficie marina, correnti).
 * @param {number} lat
 * @param {number} lon
 */
export async function getMarineData(lat, lon) {
  const key = `marine:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = weatherCache.get(key);
  if (cached) return cached;

  try {
    const response = await axios.get('https://marine-api.open-meteo.com/v1/marine', {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: 'wave_height,wave_direction,wave_period,ocean_current_velocity',
        daily: 'sea_surface_temperature_max',
        timezone: 'auto'
      },
      timeout: 10000
    });
    weatherCache.set(key, response.data);
    return response.data;
  } catch (error) {
    console.error('Errore in WeatherService (Marine):', error.message);
    throw error;
  }
}
