import './style.css';

// --- State Management ---
const baseLat = 28.6139; // Delhi center
const baseLng = 77.2090;

const state = {
  incidents: [],
  resources: [
    { id: 'R1', name: 'Medic Unit 01', type: 'ambulance', status: 'available' },
    { id: 'R2', name: 'Medic Unit 02', type: 'ambulance', status: 'available' },
    { id: 'R3', name: 'Fire Engine 14', type: 'fire', status: 'available' },
    { id: 'R4', name: 'Rescue Drone Alpha', type: 'drone', status: 'available' },
    { id: 'R5', name: 'Police Cruiser 09', type: 'police', status: 'available' },
  ],
  metrics: {
    activeCrises: 0,
    unitsDeployed: 0,
    avgResponse: '4m 12s'
  }
};

const incidentTypes = [
  { type: 'Medical', icon: 'ph-ambulance', color: 'blue', severities: ['high', 'medium'] },
  { type: 'Fire', icon: 'ph-fire', color: 'red', severities: ['critical', 'high'] },
  { type: 'Security', icon: 'ph-shield-warning', color: 'orange', severities: ['critical', 'medium'] }
];

const locations = [
  'Connaught Place', 'Vasant Kunj', 'Karol Bagh', 'Lajpat Nagar', 'Rohini', 'Dwarka'
];

let incidentCounter = 1000;
let map;
let markersLayer;
let mapMarkers = {};

// --- DOM Elements ---
const incidentFeedEl = document.getElementById('incidentFeed');
const incidentCountEl = document.getElementById('incidentCount');
const resourceListEl = document.getElementById('resourceList');
const metricsContainerEl = document.getElementById('metricsContainer');

// --- Helper Functions ---
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getIconForType = (type) => {
  if (type === 'ambulance') return 'ph-ambulance';
  if (type === 'fire') return 'ph-fire-truck';
  if (type === 'drone') return 'ph-airplane-tilt';
  if (type === 'police') return 'ph-car-profile';
  return 'ph-truck';
};

// --- Core Logic ---
function initMap() {
  // Initialize Leaflet Map
  map = L.map('tacticalMap', {
    center: [baseLat, baseLng],
    zoom: 12,
    zoomControl: false,
    attributionControl: false
  });

  // Dark theme CartoDB basemap
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

function generateIncident() {
  const typeDef = getRandom(incidentTypes);
  const severity = getRandom(typeDef.severities);
  
  const incident = {
    id: `INC-${++incidentCounter}`,
    type: typeDef.type,
    icon: typeDef.icon,
    severity: severity,
    location: getRandom(locations),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    coords: { 
      lat: baseLat + (Math.random() - 0.5) * 0.15, 
      lng: baseLng + (Math.random() - 0.5) * 0.15 
    },
    status: 'active'
  };

  state.incidents.unshift(incident);
  if (state.incidents.length > 8) {
    const removed = state.incidents.pop();
    // Remove marker for popped incident
    if (mapMarkers[removed.id]) {
      markersLayer.removeLayer(mapMarkers[removed.id]);
      delete mapMarkers[removed.id];
    }
  }
  
  updateMetrics();
  renderIncidents();
  addMapMarker(incident);
}

// --- Gemini AI Integration ---
// Pinging our secure Vercel Serverless Backend
async function generateGeminiBrief(incident) {
  const prompt = `As an emergency response AI, generate a concise 2-sentence tactical brief for a ${incident.severity} severity ${incident.type} incident located at ${incident.location}. Provide immediate tactical advice for first responders.`;

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Backend API Error:", data.error);
      return `API Error: ${data.error}`;
    }
    
    return data.brief;
  } catch (error) {
    console.error("Failed to contact secure backend:", error);
    return "Error communicating with secure backend. Check network.";
  }
}

window.getAIBrief = async (incidentId, buttonEl) => {
  const incident = state.incidents.find(i => i.id === incidentId);
  if (!incident) return;
  
  buttonEl.disabled = true;
  buttonEl.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Analyzing...';
  
  const brief = await generateGeminiBrief(incident);
  
  // Inject the brief into the card
  const card = buttonEl.closest('.incident-card');
  let briefEl = card.querySelector('.ai-brief');
  if (!briefEl) {
    briefEl = document.createElement('div');
    briefEl.className = 'ai-brief';
    briefEl.style.marginTop = '12px';
    briefEl.style.padding = '10px';
    briefEl.style.background = 'rgba(6, 182, 212, 0.1)';
    briefEl.style.borderLeft = '3px solid var(--neon-cyan)';
    briefEl.style.fontSize = '12px';
    briefEl.style.color = 'var(--text-main)';
    briefEl.style.borderRadius = '0 8px 8px 0';
    card.insertBefore(briefEl, card.querySelector('.incident-actions'));
  }
  
  briefEl.innerHTML = `<strong><i class="ph-fill ph-sparkle" style="color: var(--neon-cyan)"></i> Gemini Analysis:</strong><br/>${brief}`;
  
  buttonEl.innerHTML = '<i class="ph ph-check"></i> Analysis Complete';
};

window.dispatchResource = (incidentId) => {
  const incident = state.incidents.find(i => i.id === incidentId);
  if (!incident || incident.status === 'dispatched') return;

  // Find an available resource
  const availableResource = state.resources.find(r => r.status === 'available');
  if (availableResource) {
    incident.status = 'dispatched';
    availableResource.status = 'busy';
    
    // Update marker
    updateMapMarker(incident);
    
    // Simulate resolution after some time
    setTimeout(() => {
      availableResource.status = 'available';
      state.incidents = state.incidents.filter(i => i.id !== incidentId);
      
      // Remove marker
      if (mapMarkers[incidentId]) {
        markersLayer.removeLayer(mapMarkers[incidentId]);
        delete mapMarkers[incidentId];
      }
      
      updateMetrics();
      renderAll();
    }, 15000); // 15 seconds simulate task completion
    
    updateMetrics();
    renderAll();
  } else {
    alert('No available resources to dispatch!');
  }
}

// --- Render Functions ---
function updateMetrics() {
  state.metrics.activeCrises = state.incidents.filter(i => i.status === 'active').length;
  state.metrics.unitsDeployed = state.resources.filter(r => r.status === 'busy').length;
  
  metricsContainerEl.innerHTML = `
    <div class="metric-card metric-red">
      <div class="metric-icon"><i class="ph-fill ph-warning-circle"></i></div>
      <div class="metric-info">
        <h4>Active Crises</h4>
        <div class="value">${state.metrics.activeCrises}</div>
      </div>
    </div>
    <div class="metric-card metric-blue">
      <div class="metric-icon"><i class="ph-fill ph-truck"></i></div>
      <div class="metric-info">
        <h4>Units Deployed</h4>
        <div class="value">${state.metrics.unitsDeployed}</div>
      </div>
    </div>
    <div class="metric-card metric-green">
      <div class="metric-icon"><i class="ph-fill ph-clock-countdown"></i></div>
      <div class="metric-info">
        <h4>Avg Response</h4>
        <div class="value">${state.metrics.avgResponse}</div>
      </div>
    </div>
  `;
}

function renderIncidents() {
  incidentCountEl.textContent = state.incidents.length;
  incidentFeedEl.innerHTML = state.incidents.map(inc => `
    <div class="incident-card severity-${inc.severity}">
      <div class="incident-header">
        <div class="incident-type">
          <i class="ph ${inc.icon}"></i> ${inc.type} Incident
        </div>
        <div class="incident-time">${inc.time}</div>
      </div>
      <div class="incident-title">${inc.id} reported at ${inc.location}</div>
      <div class="incident-actions" style="display: flex; gap: 8px;">
        <button class="btn-dispatch" style="background: rgba(6, 182, 212, 0.1); color: var(--neon-cyan); border-color: rgba(6, 182, 212, 0.3);" onclick="getAIBrief('${inc.id}', this)">
          <i class="ph ph-sparkle"></i> AI Brief
        </button>
        ${inc.status === 'active' 
          ? `<button class="btn-dispatch" onclick="dispatchResource('${inc.id}')">Dispatch AI</button>`
          : `<button class="btn-dispatch dispatched" disabled>Units En Route</button>`
        }
      </div>
    </div>
  `).join('');
}

function renderResources() {
  resourceListEl.innerHTML = state.resources.map(res => `
    <div class="resource-item">
      <div class="resource-info">
        <div class="resource-icon">
          <i class="ph ${getIconForType(res.type)}"></i>
        </div>
        <div class="resource-details">
          <h5>${res.name}</h5>
          <p>${res.id}</p>
        </div>
      </div>
      <div class="resource-status status-${res.status}">
        ${res.status === 'available' ? 'Available' : 'Deployed'}
      </div>
    </div>
  `).join('');
}

function getMarkerColor(incident) {
  if (incident.status === 'dispatched') return '#9ca3af'; // muted
  if (incident.severity === 'critical') return '#ef4444'; // red
  if (incident.severity === 'high') return '#f59e0b'; // orange
  return '#06b6d4'; // cyan
}

function addMapMarker(incident) {
  const color = getMarkerColor(incident);
  const html = `
    <div class="map-blip" style="position: relative;">
      <div class="blip-pulse" style="background: ${color}; opacity: 0.3;"></div>
      <div class="blip-core" style="background: ${color}; box-shadow: 0 0 10px ${color};"></div>
      <div class="blip-label" style="opacity: 1; top: -20px; color: white;">${incident.id}</div>
    </div>
  `;
  
  const icon = L.divIcon({
    html: html,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  const marker = L.marker([incident.coords.lat, incident.coords.lng], { icon }).addTo(markersLayer);
  mapMarkers[incident.id] = marker;
}

function updateMapMarker(incident) {
  if (mapMarkers[incident.id]) {
    const color = getMarkerColor(incident);
    const html = `
      <div class="map-blip" style="position: relative;">
        <div class="blip-core" style="background: ${color}; box-shadow: 0 0 5px ${color};"></div>
        <div class="blip-label" style="opacity: 1; top: -20px; color: white;">${incident.id} (En Route)</div>
      </div>
    `;
    const icon = L.divIcon({
      html: html,
      className: '',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
    mapMarkers[incident.id].setIcon(icon);
  }
}

function renderAll() {
  renderIncidents();
  renderResources();
}

// --- Navigation Mock ---
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const dashboardView = document.getElementById('dashboardView');
  const comingSoonView = document.getElementById('comingSoonView');
  const comingSoonTitle = document.getElementById('comingSoonTitle');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const text = e.target.closest('.nav-item').textContent.trim();
      
      navItems.forEach(n => n.classList.remove('active'));
      e.target.closest('.nav-item').classList.add('active');

      if (text !== 'Command Center') {
        dashboardView.style.display = 'none';
        comingSoonView.style.display = 'flex';
        comingSoonTitle.textContent = `${text} is in Development`;
      } else {
        dashboardView.style.display = 'grid';
        comingSoonView.style.display = 'none';
      }
    });
  });
}

// --- Initialization & Simulation Loop ---
function init() {
  initMap();
  setupNavigation();
  updateMetrics();
  renderAll();
  
  // Initial seed
  generateIncident();
  generateIncident();

  // Simulation Loop
  setInterval(() => {
    if (Math.random() > 0.7) {
      generateIncident();
    }
  }, 5000);
}

document.addEventListener('DOMContentLoaded', init);
