
# 🛡️ SecureSense AI — Real-Time SOC Threat Monitoring Dashboard

SecureSense AI is a **real-time Security Operations Center (SOC) dashboard** that integrates AI-powered threat analysis, live monitoring, and cybersecurity intelligence tools into a unified interface.

It provides **real-time threat ingestion, visualization, AI summarization, and security utilities** for analysts.

---

# 🚀 Features

### 🔴 Real-Time Threat Monitoring
- WebSocket-based live threat ingestion
- Dynamic SOC stream updates
- Auto severity classification

### 🌍 Global Attack Map
- Live attack visualization
- Severity-based threat markers
- SOC-style dark theme map

### 📊 Threat Analytics Dashboard
- Threat severity distribution
- Attack timeline
- MITRE ATT&CK heatmap
- KPI metrics panel

### 🤖 AI Capabilities
- AI threat summary generator
- AI cybersecurity assistant (LLM powered)
- Automatic threat classification

### 🛠️ Security Tools
- URL reputation scanner
- IP reputation lookup
- CVE vulnerability lookup
- AI assistant queries

### 🔐 Authentication
- Login-based access control
- Session persistence
- Logout functionality

---

# 🧠 Architecture

Frontend (React + Tailwind)
        │
        ▼
FastAPI Backend
        │
        ├── AI Engine (Groq LLM)
        ├── Threat Service
        ├── WebSocket Server
        └── Security Tool APIs

---

# 🏗️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Recharts
- Axios
- React Leaflet (Map Visualization)

### Backend
- FastAPI
- WebSockets
- Python
- Groq LLM API
- Requests

### AI Components
- LLaMA 3.1 (Groq)
- Threat scoring engine
- AI summarization module

---

# 📂 Project Structure

securesense/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── models/
│   │   └── main.py
│
├── securesense-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── config/
│   │   └── App.jsx
│
└── README.md

---

# ⚙️ Installation

## 1. Clone Repository

git clone https://github.com/yourusername/securesense-ai.git
cd securesense-ai

---

## 2. Backend Setup

cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

Backend runs at:

http://127.0.0.1:8000

---

## 3. Frontend Setup

cd securesense-frontend
npm install
npm run dev

Frontend runs at:

http://localhost:5173

---

# 🔑 Environment Variables

Create `.env` in backend:

GROQ_API_KEY=your_groq_api_key
ABUSEIPDB_API_KEY=your_api_key
VIRUSTOTAL_API_KEY=your_api_key

---

# 📡 API Endpoints

### Threat Monitoring
GET    /api/threats
WS     /ws/alerts

### AI Services
POST   /api/chat
POST   /api/ai-summary

### Security Tools
POST   /api/scan-url
POST   /api/check-ip
GET    /api/cve/{id}

---

# 🔐 Login Credentials (Demo)

Username: admin
Password: admin123

---

# 🧪 Testing

Run backend
uvicorn app.main:app --reload

Run frontend
npm run dev

Open
http://localhost:5173

---

# 🎯 Use Cases

- Security Operations Center dashboards
- Cybersecurity monitoring tools
- Threat intelligence visualization
- Hackathon cybersecurity project
- AI-powered SOC assistant

---

# 👨‍💻 Author

Yash Singh  
AI & ML Engineer  
SecureSense AI Project

---

# 📜 License

MIT License
