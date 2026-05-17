import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCoordinates } from './geoService.js';
import { getWeatherForecast, getHistoricalClimatology, getAirQuality, getMarineData } from './weatherService.js';
import { validateEnvironmentalData } from '../utils/validator.js';
import prompts from '../config/prompts.json' with { type: 'json' };

export class QuotaExceededError extends Error {
  constructor(retryAfter = 60) {
    super('Quota API Gemini esaurita.');
    this.name = 'QuotaExceededError';
    this.retryAfter = retryAfter;
  }
}

const MAX_TOOL_ITERATIONS = 5;

const TOOL_HANDLERS = {
  get_coordinates:          (args) => getCoordinates(args.location_name),
  get_weather_forecast:     (args) => getWeatherForecast(args.lat, args.lon),
  get_historical_climatology: (args) => getHistoricalClimatology(args.lat, args.lon, args.start_date, args.end_date),
  get_air_quality:          (args) => getAirQuality(args.lat, args.lon),
  get_marine_data:          (args) => getMarineData(args.lat, args.lon),
};

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('ATTENZIONE: GEMINI_API_KEY non trovata nel file .env');
}

const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

// Definizione delle funzioni (Tools) per Gemini
const tools = [
  {
    functionDeclarations: [
      {
        name: 'get_coordinates',
        description: 'Risolve un nome di località (es. "Genova") in coordinate geografiche (lat, lon).',
        parameters: {
          type: 'OBJECT',
          properties: {
            location_name: { type: 'STRING', description: 'Il nome della città o località.' }
          },
          required: ['location_name']
        }
      },
      {
        name: 'get_weather_forecast',
        description: 'Recupera previsioni meteo complete (temperatura, pioggia, UV, radiazione, visibilità, raffiche, neve, umidità suolo, vento ad alta quota). Usa per query su oggi, domani, agricoltura, energia, salute, LOGISTICA (visibilità/raffiche), URBANISTICA (umidità suolo), EDILIZIA (vento 80/120m), TURISMO (neve).',
        parameters: {
          type: 'OBJECT',
          properties: {
            lat: { type: 'NUMBER', description: 'Latitudine' },
            lon: { type: 'NUMBER', description: 'Longitudine' }
          },
          required: ['lat', 'lon']
        }
      },
      {
        name: 'get_historical_climatology',
        description: 'Recupera dati storici (temperatura, pioggia, radiazione) dal 1940 ad oggi. Usa per confronti a lungo termine e analisi storiche verticali.',
        parameters: {
          type: 'OBJECT',
          properties: {
            lat: { type: 'NUMBER', description: 'Latitudine' },
            lon: { type: 'NUMBER', description: 'Longitudine' },
            start_date: { type: 'STRING', description: 'Data di inizio in formato YYYY-MM-DD' },
            end_date: { type: 'STRING', description: 'Data di fine in formato YYYY-MM-DD' }
          },
          required: ['lat', 'lon', 'start_date', 'end_date']
        }
      },
      {
        name: 'get_air_quality',
        description: 'Recupera dati sulla qualità dell\'aria (PM10, PM2.5, O3, NO2). Usa per query sulla salute e inquinamento.',
        parameters: {
          type: 'OBJECT',
          properties: {
            lat: { type: 'NUMBER', description: 'Latitudine' },
            lon: { type: 'NUMBER', description: 'Longitudine' }
          },
          required: ['lat', 'lon']
        }
      },
      {
        name: 'get_marine_data',
        description: 'Recupera dati marini (altezza onde, direzione, periodo, velocità correnti, temperatura superficie marina). Usa per query su navigazione, sport acquatici e sicurezza marittima.',
        parameters: {
          type: 'OBJECT',
          properties: {
            lat: { type: 'NUMBER', description: 'Latitudine' },
            lon: { type: 'NUMBER', description: 'Longitudine' }
          },
          required: ['lat', 'lon']
        }
      }
    ]
  }
];

// Generazione dinamica delle istruzioni di sistema
const verticalText = Object.entries(prompts.vertical_guidelines)
  .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
  .join('\n');

const systemInstruction = `${prompts.system_instruction_main}\n${verticalText}\n${prompts.guardrails}`;

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash',
  tools,
  systemInstruction
});

/**
 * Gestisce il loop della conversazione e le chiamate alle funzioni.
 * @param {string} userInput - Messaggio dell'utente.
 * @param {Array} history - Cronologia dei messaggi precedente.
 * @param {Object} userContext - Contesto dell'utente (lat, lon, date).
 */
export async function processWeatherQuery(userInput, history = [], userContext = null) {
  try {
    const today = new Date().toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const details = userContext?.lat && userContext?.lon 
      ? `Lat=${userContext.lat}, Lon=${userContext.lon}` 
      : (userContext?.date ? `Date=${userContext.date}` : 'Nessuno');

    // Task 1 & 3 Prompt 2: Positional tokens e Delimiter
    const finalInput = prompts.context_template
      .replace('%1', today)
      .replace('%2', details)
      .replace('%3', userInput);

    const chat = model.startChat({ history });
    let result = await chat.sendMessage(finalInput);
    let response = result.response;

    let iterations = 0;

    // Loop per gestire le chiamate alle funzioni (Function Calling)
    while (response.functionCalls()?.length > 0 && iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      const callResults = await Promise.all(
        response.functionCalls().map(async (call) => {
          const { name, args } = call;
          let output;

          console.log(`[AI Calling Tool]: ${name}`, args);

          try {
            const handler = TOOL_HANDLERS[name];
            if (handler) {
              output = await handler(args);

              // Task 4 Prompt 1: Multi-alert aggregation
              const safetyReport = validateEnvironmentalData(name, output);
              if (safetyReport && safetyReport.alerts?.length > 0) {
                const reasons = safetyReport.alerts.map(a => `[${a.severity}] ${a.reason}`).join(' | ');
                output = { 
                  ...output, 
                  _SAFETY_NOTICE: prompts.safety_alert_template.replace('%1', reasons)
                };
              }
            } else {
              output = { error: `Funzione non riconosciuta: ${name}` };
            }
          } catch (error) {
            output = { error: error.message };
          }

          return {
            functionResponse: {
              name,
              response: { content: output }
            }
          };
        })
      );

      // Invia i risultati delle funzioni a Gemini per generare la risposta finale
      result = await chat.sendMessage(callResults);
      response = result.response;
    }

    if (iterations >= MAX_TOOL_ITERATIONS) {
      console.warn(`[GeminiService] Raggiunto il limite di ${MAX_TOOL_ITERATIONS} iterazioni tool per questa query.`);
    }

    return response.text();
  } catch (error) {
    console.error('Errore in GeminiService:', error);

    // Gestione specifica dell'errore 429 (Too Many Requests / Quota Exceeded)
    if (error.status === 429 || error.response?.status === 429 || error.message?.includes('429')) {
      let retryAfter = 60;
      try {
        const details = error.response?.data?.error?.details || [];
        const quotaFailure = details.find(d => d.retryDelay || d['@type']?.includes('RetryInfo'));
        if (quotaFailure?.retryDelay) {
          retryAfter = parseInt(quotaFailure.retryDelay) || 60;
        }
      } catch (_) { /* fallback al default */ }

      throw new QuotaExceededError(retryAfter);
    }

    throw error;
  }
}
