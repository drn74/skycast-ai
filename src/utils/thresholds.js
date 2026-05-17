/**
 * Configurazione delle soglie deterministiche (WMO/OMS) per SkyCast AI.
 * 
 * UV_INDEX: > 8 (Very High/Extremely High)
 * WIND_GUSTS_10M: > 60 km/h
 * WIND_SPEED_80M: > 15 m/s (54 km/h) per operatività gru
 * SOIL_TEMPERATURE: < 0 °C per integrità cemento
 * WAVE_HEIGHT: > 2.5 m (Rough sea)
 * VISIBILITY: < 1000 m (Fog alert)
 * PM10: > 50 µg/m³ (WHO limit for 24h)
 */

export const THRESHOLDS = {
  UV_INDEX: {
    value: 8,
    operator: '>',
    message: 'Indice UV critico (> 8). Pericolo per la pelle.',
    severity: 'HIGH'
  },
  WIND_GUSTS_10M: {
    value: 60,
    operator: '>',
    message: 'Raffiche di vento elevate (> 60 km/h).',
    severity: 'HIGH'
  },
  WIND_SPEED_80M: {
    value: 54, // 15 m/s convertito in km/h (default Open-Meteo)
    operator: '>',
    message: 'Vento in quota pericoloso per operatività gru (> 15 m/s).',
    severity: 'HIGH'
  },
  SOIL_TEMPERATURE: {
    value: 0,
    operator: '<',
    message: 'Temperatura del suolo sotto lo zero. Rischio per gettate di cemento.',
    severity: 'MEDIUM'
  },
  WAVE_HEIGHT: {
    value: 2.5,
    operator: '>',
    message: 'Altezza onde critica (> 2.5 m). Allerta marittima.',
    severity: 'HIGH'
  },
  VISIBILITY: {
    value: 1000, // In metri (default Open-Meteo)
    operator: '<',
    message: 'Visibilità ridotta (< 1 km). Allerta nebbia.',
    severity: 'MEDIUM'
  },
  PM10: {
    value: 50,
    operator: '>',
    message: 'Qualità dell\'aria scadente (PM10 > 50 µg/m³).',
    severity: 'MEDIUM'
  }
};

export const POLLEN_THRESHOLDS = {
  grass_pollen:   { medium: 10, high: 50, very_high: 200 },
  birch_pollen:   { medium: 10, high: 50, very_high: 200 },
  ragweed_pollen: { medium: 10, high: 30, very_high: 100 },
  olive_pollen:   { medium: 10, high: 50, very_high: 200 },
};
