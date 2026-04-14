# 🎵 VibeSync

**VibeSync** is a premium, AI-powered music curator that transforms your current mood or "vibe" into a perfectly stitched sonic landscape. Using Google's Gemini AI and Spotify, it analyzes your feelings and builds a custom playlist designed just for your current state of mind.

![VibeSync Preview](https://github.com/vansh7nvc/VibeSync/raw/main/src/assets/preview.png) *(Note: Placeholder link for preview)*

## ✨ Features

- **🧠 AI Mood Analysis**: Deep analysis of your descriptive input using Gemini Pro.
- **🎨 Dynamic UI**: A premium, "liquid" interface that changes its atmosphere based on the mood detected.
- **🎧 Spotify Integration**: Connect your account and instantly create AI-curated playlists.
- **📱 Responsive Design**: Seamless experience across mobile and desktop.
- **✨ Micro-animations**: Fluid transitions powered by Framer Motion for a high-end feel.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Motion.
- **Backend**: Node.js, Express, TSX.
- **AI**: Gemini 1.5 Flash (via Google AI Studio).
- **Auth/API**: Spotify Web API.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- A Google AI Studio API Key
- A Spotify Developer Account

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vansh7nvc/VibeSync.git
   cd VibeSync
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   SPOTIFY_CLIENT_ID="your_spotify_client_id"
   SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
   GEMINI_API_KEY="your_gemini_api_key"
   SESSION_SECRET="your_secret_session_key"
   APP_URL="http://localhost:3000"
   ```

4. **Run the application**:
   ```bash
   npm run dev
   ```

5. **Visit the app**: Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How it Works

1. **Describe Your Vibe**: Enter how you're feeling (e.g., "Late night drive through a neon city").
2. **AI Analysis**: Gemini analyzes the mood, detects an associated color, and recommends 8-10 tracks.
3. **Explore & Save**: Preview the songs on Spotify/YouTube or heart them to save to your collection.
4. **Sync with Spotify**: Connect your Spotify account to instantly turn the vibe into a real playlist.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ by [Vansh](https://github.com/vansh7nvc)
