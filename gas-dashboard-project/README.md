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
- Modular folder structure
- Reusable hooks and components

## Install
```bash
npm install
npm run dev
```

## Firebase Setup
Update `src/config/firebase.js` with your Firebase project configuration.

This project expects the following Firebase nodes:
- `TempnHumData/latest`, `TempnHumData/history`, `TempnHumData/analysis`
- `gassensorData/latest`, `gassensorData/history`, `gassensorData/analysis`
- `FridgeDoor/latest`, `FridgeDoor/history`, `FridgeDoor/analysis`
- `fire_monitoring/latest`, `fire_monitoring/history`, `fire_monitoring/analysis`
