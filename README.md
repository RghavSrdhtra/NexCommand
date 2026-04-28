# NexCommand 🚨

**NexCommand** is an intelligent, rapid crisis response platform and unified dashboard designed to aggregate emergency feeds and instantly allocate resources. During an urban crisis, control rooms are flooded with fragmented data, causing critical delays. NexCommand bridges this gap by acting as an AI-assisted "control tower."

## 🌟 Features
- **Live Incident Feed**: Real-time simulated stream of incoming emergencies categorized by type (Medical, Fire, Security).
- **Gemini AI Situation Briefs**: Uses the live `gemini-flash-latest` model to analyze incident parameters and generate immediate tactical response advice.
- **Intelligent Dispatch**: Automated matching of crises with the nearest available physical assets (Ambulances, Fire Engines, Drones).
- **Interactive Tactical Map**: Powered by Leaflet.js with CartoDB Dark Matter tiles, providing geographic awareness in a high-stress environment.
- **Glassmorphism UI**: A premium, dark-themed command center built to reduce operator eye strain and highlight severe alerts using neon accents.

## 🚀 Quick Start

We have provided quick-start scripts to get the prototype running on your local machine instantly. This is a client-side prototype, so no server setup is required.

### Prerequisites
- [Node.js](https://nodejs.org/) must be installed on your machine.

### For Windows:
Double-click the `start.bat` file in the root folder, OR run the following in your command prompt:
```cmd
start.bat
```

### For Mac / Linux:
Run the bash script from your terminal:
```bash
chmod +x start.sh
./start.sh
```

### Manual Boot (Alternative):
If you prefer not to use the scripts, simply run:
```bash
npm install
npm run dev
```

The terminal will provide a local URL (usually `http://localhost:5173/`). Click it to open the NexCommand Dashboard in your browser!

## 🛠️ Tech Stack
- **Build Tool**: Vite
- **Frontend**: Vanilla HTML, CSS3 (Custom Properties & Glassmorphism), ES6 JavaScript
- **Mapping**: Leaflet.js

## 🔒 Security Note
**No API Keys Required:** This prototype is built entirely using open-source libraries and free-tier CDN assets (like CartoDB basemaps and Phosphor Icons). There are absolutely no private API keys embedded in this codebase. It is 100% safe to run and review.
