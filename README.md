# SkyCast AI

Un orchestratore ambientale avanzato che trasforma dati meteorologici e climatici grezzi in insight decisionali per settori industriali. Proof of Concept basato su un approccio **Agentic Man-in-the-Loop** con Gemini 2.5 Flash.

## Come funziona

A differenza di una normale app meteo, SkyCast *agisce*: riceve la domanda dell'utente, decide autonomamente quali strumenti invocare (Function Calling), recupera dati in tempo reale e sintetizza un'analisi tecnica verticale in Markdown.

**Flusso:**
1. L'utente invia una query — il frontend allega automaticamente coordinate GPS e data corrente
2. Gemini analizza l'intent e invoca i tool necessari; ogni chiamata appare in tempo reale come pillola animata nell'interfaccia
3. I dati grezzi vengono validati contro soglie WMO/OMS — eventuali alert di sicurezza vengono iniettati nel contesto
4. Gemini genera la risposta in **streaming**, che appare progressivamente nella chat

## Tool disponibili

| Tool | Fonte | Utilizzo |
| :--- | :--- | :--- |
| `get_coordinates` | Nominatim | Risolve nome città → coordinate |
| `get_weather_forecast` | Open-Meteo | Previsioni 7 giorni + dati attuali |
| `get_historical_climatology` | Open-Meteo Archive | Dati storici dal 1940 |
| `get_air_quality` | Open-Meteo AQI | PM10, PM2.5, O3, NO2 |
| `get_marine_data` | Open-Meteo Marine | Onde, correnti, temperatura marina |
| `get_pollen_data` | Open-Meteo AQI | Polline (betulla, graminacee, olivo, ambrosia…) |
| `get_tide_forecast` | WorldTides API | Alta/bassa marea per 3 giorni |

## Verticali supportate

| Settore | Parametri chiave |
| :--- | :--- |
| **Edilizia** | Vento a 80m/120m, temperatura suolo — operatività gru, integrità calcestruzzo |
| **Energia** | Radiazione solare — potenziale fotovoltaico |
| **Agricoltura** | Umidità suolo (0-7cm), precipitazioni — stress idrico, irrigazione |
| **Logistica** | Visibilità, raffiche di vento — sicurezza trasporti |
| **Marittimo** | Onde, correnti, SST, maree — navigazione e operazioni portuali |
| **Salute** | PM10, PM2.5, O3, NO2, UV, polline — qualità dell'aria e allergie stagionali |

## Stack

- **Runtime:** Node.js v25.2.0+ (ESM)
- **AI:** `@google/generative-ai` — Gemini 2.5 Flash con Function Calling + streaming SSE
- **Backend:** Express 5
- **Frontend:** SPA Vanilla JS/CSS + React 18 (CDN) + Marked.js
- **Dati:** [Open-Meteo](https://open-meteo.com/) · [Nominatim](https://nominatim.org/) · [WorldTides](https://www.worldtides.info/)

## Installazione

```bash
# 1. Clona il repository
git clone https://github.com/drn74/skycast-ai.git
cd skycast-ai

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env e inserisci le tue chiavi API

# 4. Avvia il server
npm start
```

Apri `http://localhost:3000` nel browser e consenti l'accesso alla posizione per la geolocalizzazione automatica.

## Configurazione

```env
GEMINI_API_KEY=la_tua_chiave          # Obbligatoria — aistudio.google.com
GEMINI_MODEL_NAME=gemini-2.5-flash    # Modello Gemini da usare
PORT=3000
WORLDTIDES_API_KEY=la_tua_chiave      # Opzionale — worldtides.info (free tier 100 req/day)
```

Senza `WORLDTIDES_API_KEY` il tool maree non è disponibile; tutti gli altri funzionano normalmente.

## Struttura del progetto

```
src/
├── server.js                  # Entry point Express
├── routes/
│   ├── query.route.js         # POST /api/query — orchestrazione agentica (SSE)
│   └── weather.route.js       # GET /api/weather/*, /api/model — dati grezzi
├── services/
│   ├── geminiService.js       # Loop function calling + streaming SSE
│   ├── weatherService.js      # Wrapper Open-Meteo, WorldTides
│   └── geoService.js          # Geocoding Nominatim
├── utils/
│   ├── validator.js           # Validazione soglie WMO/OMS/EAN
│   └── thresholds.js          # Costanti di soglia per settore
└── config/
    └── prompts.json           # Istruzioni di sistema e linee guida verticali

public/
├── index.html                 # SPA frontend (React 18 CDN + Babel)
└── style.css                  # Dark theme / glassmorphism
```

## Esempi di utilizzo

- *"Che tempo fa?"* — analisi per la posizione corrente
- *"Posso gettare il cemento domani?"* — analisi edilizia con controllo temperatura suolo e vento
- *"Pioveva di più qui 30 anni fa?"* — confronto storico automatico (archivio dal 1940)
- *"Livelli di polline a Firenze questa settimana"* — report allergie stagionali
- *"Maree a Venezia domani"* — orari e altezze alta/bassa marea
- *"Condizioni di navigazione al largo di Genova"* — analisi marittima completa

## Licenza

MIT
