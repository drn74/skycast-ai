import { THRESHOLDS } from './thresholds.js';

/**
 * Valida i dati ambientali estratti dai tool deterministici di SkyCast AI.
 * Analizza i dati in input (JSON da Open-Meteo) e confronta i valori con le soglie WMO/OMS.
 * 
 * @param {string} toolName - Nome del tool invocato (es. 'get_weather_forecast').
 * @param {Object} data - Il payload JSON ricevuto dal servizio meteo.
 * @returns {Object|null} Un oggetto contenente l'array di alert se vengono rilevate anomalie, altrimenti null.
 */
export function validateEnvironmentalData(toolName, data) {
  if (!data) return null;

  const foundAlerts = [];

  /**
   * Helper per verificare una soglia e aggiungere all'elenco se violata.
   */
  const checkThreshold = (value, thresholdKey, displayValue) => {
    const threshold = THRESHOLDS[thresholdKey];
    if (!threshold) return;

    const isAlert = threshold.operator === '>' 
      ? value > threshold.value 
      : value < threshold.value;

    if (isAlert) {
      foundAlerts.push({
        reason: `${threshold.message} (Valore rilevato: ${displayValue})`,
        severity: threshold.severity
      });
    }
  };

  // 1. Geocoding Validation
  if (toolName === 'get_coordinates') {
    const lat = parseFloat(data.lat);
    const lon = parseFloat(data.lon);
    const isValid = Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
                    Number.isFinite(lon) && lon >= -180 && lon <= 180;
    
    if (!isValid) {
      foundAlerts.push({
        reason: "Geocoding returned invalid coordinates.",
        severity: "MEDIUM"
      });
    }
  }

  // 2. Weather Forecast Validation
  if (toolName === 'get_weather_forecast') {
    // UV Index (Daily)
    if (data.daily?.uv_index_max?.length) {
      const validUV = data.daily.uv_index_max.filter(v => v !== null);
      if (validUV.length > 0) {
        const maxUV = Math.max(...validUV);
        checkThreshold(maxUV, 'UV_INDEX', maxUV);
      }
    }

    // Raffiche di vento (Hourly)
    if (data.hourly?.wind_gusts_10m?.length) {
      const validGusts = data.hourly.wind_gusts_10m.filter(v => v !== null);
      if (validGusts.length > 0) {
        const maxGusts = Math.max(...validGusts);
        checkThreshold(maxGusts, 'WIND_GUSTS_10M', `${maxGusts} km/h`);
      }
    }

    // Vento 80m per gru (Hourly)
    if (data.hourly?.wind_speed_80m?.length) {
      const validWind80 = data.hourly.wind_speed_80m.filter(v => v !== null);
      if (validWind80.length > 0) {
        const maxWind80 = Math.max(...validWind80);
        checkThreshold(maxWind80, 'WIND_SPEED_80M', `${maxWind80} km/h`);
      }
    }

    // Temperatura suolo per cemento (Hourly)
    if (data.hourly?.soil_temperature_0_to_7cm?.length) {
      const validSoilTemp = data.hourly.soil_temperature_0_to_7cm.filter(v => v !== null);
      if (validSoilTemp.length > 0) {
        const minSoilTemp = Math.min(...validSoilTemp);
        checkThreshold(minSoilTemp, 'SOIL_TEMPERATURE', `${minSoilTemp} °C`);
      }
    }

    // Visibilità nebbia (Hourly)
    if (data.hourly?.visibility?.length) {
      const validVisibility = data.hourly.visibility.filter(v => v !== null);
      if (validVisibility.length > 0) {
        const minVisibility = Math.min(...validVisibility);
        checkThreshold(minVisibility, 'VISIBILITY', `${minVisibility} m`);
      }
    }
  }

  // 3. Air Quality Validation
  if (toolName === 'get_air_quality' && data.hourly?.pm10?.length) {
    const validPM10 = data.hourly.pm10.filter(v => v !== null);
    if (validPM10.length > 0) {
      const maxPM10 = Math.max(...validPM10);
      checkThreshold(maxPM10, 'PM10', `${maxPM10} µg/m³`);
    }
  }

  // 4. Marine Data Validation
  if (toolName === 'get_marine_data' && data.hourly?.wave_height?.length) {
    const validWaves = data.hourly.wave_height.filter(v => v !== null);
    if (validWaves.length > 0) {
      const maxWaveHeight = Math.max(...validWaves);
      checkThreshold(maxWaveHeight, 'WAVE_HEIGHT', `${maxWaveHeight} m`);
    }
  }

  // 5. Historical Data Guard
  if (toolName === 'get_historical_climatology') {
    const validMaxTemp = data.daily?.temperature_2m_max?.filter(v => v !== null) || [];
    if (validMaxTemp.length === 0) {
      foundAlerts.push({
        reason: "Historical data returned no valid values for the requested date range.",
        severity: "LOW"
      });
    }
  }

  if (foundAlerts.length === 0) return null;

  // Ordina per severità: HIGH > MEDIUM > LOW
  const severityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
  foundAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return { alerts: foundAlerts };
}
