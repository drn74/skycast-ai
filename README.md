# SkyCast AI

Un orchestratore ambientale avanzato che trasforma dati meteorologici e climatici grezzi in insight decisionali per settori industriali. Proof of Concept basato su un approccio **Agentic Man-in-the-Loop** con Gemini 2.5 Flash.

## Come funziona

A differenza di una normale app meteo, SkyCast *agisce*: riceve la domanda dell'utente, decide autonomamente quali strumenti invocare (Function Calling), recupera dati in tempo reale e sintetizza un'analisi tecnica verticale in Markdown.

**Flusso:**
1. L'utente invia una query — il frontend allega automaticamente coordinate GPS e data corrente
2. Gemini analizza l'intent e invoca i tool necessari (`get_coordinates`, `get_weather_forecast`, `get_historical_climatology`, `get_air_quality`, `get_marine_data`)
3. I dati grezzi vengono validati contro soglie WMO/OMS — eventuali alert di sicurezza vengono iniettati nel contesto
4. Gemini genera una risposta Markdown con analisi tecnica verticale

## Verticali supportate

| Settore | Parametri chiave |
| :--- | :--- |
| **Edilizia** | Vento a 80m/120m, temperatura suolo — operatività gru, integrità calcestruzzo |
| **Energia** | Radiazione solare — potenziale fotovoltaico |
| **Agricoltura** | Umidità suolo (0-7cm), precipitazioni — stress idrico, irrigazione |
| **Logistica** | Visibilità, raffiche di vento — sicurezza trasporti |
| **Marittimo** | Altezza/direzione/periodo onde, correnti, SST — navigazione |
| **Salute** | PM10, PM2.5, O3, NO2, UV — qualità dell'aria |

## Stack

- **Runtime:** Node.js v25.2.0+ (ESM)
- **AI:** `@google/generative-ai` — Gemini 2.5 Flash con Function Calling
- **Backend:** Express 5
- **Frontend:** SPA Vanilla JS/CSS + React 18 (CDN) + Marked.js
- **Dati:** [Open-Meteo](https://open-meteo.com/) (previsioni, storico dal 1940, qualità aria, dati marini) + [Nominatim](https://nominatim.org/) (geocoding)

## Installazione

```bash
# 1. Clona il repository
git clone https://github.com/drn74/skycast-ai.git
cd skycast-ai

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env e inserisci la tua GEMINI_API_KEY

# 4. Avvia il server
npm start
```

Apri `http://localhost:3000` nel browser e consenti l'accesso alla posizione per la geolocalizzazione automatica.

## Configurazione

Copia `.env.example` in `.env` e compila:

```env
GEMINI_API_KEY=la_tua_chiave_api
GEMINI_MODEL_NAME=gemini-2.5-flash
PORT=3000
```

Ottieni una chiave API gratuita su [Google AI Studio](https://aistudio.google.com/).

## Struttura del progetto

```
src/
├── server.js                  # Entry point Express
├── routes/
│   ├── query.route.js         # POST /api/query — orchestrazione agentica
│   └── weather.route.js       # GET /api/geo, /api/weather/* — dati grezzi
├── services/
│   ├── geminiService.js       # Loop di function calling, definizione tool
│   ├── weatherService.js      # Wrapper Open-Meteo API
│   └── geoService.js          # Geocoding Nominatim
├── utils/
│   ├── validator.js           # Validazione soglie WMO/OMS
│   └── thresholds.js          # Costanti di soglia per settore
└── config/
    └── prompts.json           # Istruzioni di sistema e linee guida verticali

public/
├── index.html                 # SPA frontend
└── style.css                  # Dark theme / glassmorphism
```

## Esempi di utilizzo

- *"Che tempo fa?"* — analisi per la posizione corrente
- *"Posso gettare il cemento domani?"* — analisi edilizia con controllo temperatura suolo e vento
- *"Pioveva di più qui 30 anni fa?"* — confronto storico automatico (archivio dal 1940)
- *"Qualità dell'aria a Milano questa settimana"* — report PM10/PM2.5/O3
- *"Condizioni di navigazione al largo di Genova"* — analisi marittima

## Licenza

MIT
