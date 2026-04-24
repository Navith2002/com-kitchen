# Smart Kitchen Monitoring Dashboard

A modular React + Firebase dashboard for a smart kitchen monitoring system.

## Pages
- Overview
- Temperature & Humidity
- Gas
- Fridge
- Fire

## Features
- Firebase Realtime Database integration
- Live cards, trend charts, gauge, alerts, tables, correlation, forecast
- Global floating **Analytics Copilot** chatbot available on every dashboard route
- Natural-language Q&A over live gas, temperature/humidity, fridge, and fire context
- Trend/anomaly explanation and decision-oriented prompt support (for example: "what influences X?")
- Route-aware chatbot guidance so responses are adapted to the page you are currently viewing
- OpenAI-compatible LLM support with automatic local context-aware fallback when LLM config is missing or unavailable
- Modular folder structure
- Reusable hooks and components

## Install
```bash
npm install
npm run dev
```

## Optional LLM Configuration (Analytics Copilot)
Set these optional variables in your `.env` file to enable remote LLM responses:

- `VITE_LLM_API_URL` — Base URL of an OpenAI-compatible endpoint (for example, `https://api.openai.com/v1`)
- `VITE_LLM_API_KEY` — API key for the endpoint
- `VITE_LLM_MODEL` — Model name to use (defaults to `gpt-4o-mini` when unset)

If `VITE_LLM_API_URL` or `VITE_LLM_API_KEY` is missing, or the endpoint is unavailable, the chatbot continues to respond using a local context-aware fallback.

## Firebase Setup
Update `src/config/firebase.js` with your Firebase project configuration.

This project expects the following Firebase nodes:
- `TempnHumData/latest`, `TempnHumData/history`, `TempnHumData/analysis`
- `gassensorData/latest`, `gassensorData/history`, `gassensorData/analysis`
- `FridgeDoor/latest`, `FridgeDoor/history`, `FridgeDoor/analysis`
- `fire_monitoring/latest`, `fire_monitoring/history`, `fire_monitoring/analysis`
