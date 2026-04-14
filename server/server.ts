import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import cookieSession from 'cookie-session';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'vibe-sync-secret'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: 'none',
  }));

  const getRedirectUri = (req: any) => {
    // Prefer APP_URL if available, otherwise use request headers
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    return `${baseUrl.replace(/\/$/, '')}/auth/spotify/callback`;
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Spotify Auth URL
  app.get('/api/auth/spotify/url', (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Spotify Client ID not configured' });
    }

    const redirectUri = getRedirectUri(req);
    const scope = 'playlist-modify-public playlist-modify-private user-read-private user-read-email';
    
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scope,
      show_dialog: 'true'
    });

    res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  });

  // Spotify Auth Callback
  app.get(['/auth/spotify/callback', '/auth/spotify/callback/'], async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send('Missing code or configuration');
    }

    try {
      const redirectUri = getRedirectUri(req);
      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await axios.post('https://accounts.spotify.com/api/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri,
        }).toString(),
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      req.session!.spotify_token = response.data.access_token;
      req.session!.spotify_refresh_token = response.data.refresh_token;

      res.send(`
        <html>
          <body style="background: #0a0a0a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <div style="text-align: center;">
              <h2 style="color: #f97316;">VibeSync</h2>
              <p>Connected to Spotify! This window will close automatically.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('Spotify Auth Error:', error.response?.data || error.message);
      res.status(500).send('Authentication failed');
    }
  });

  // Check Auth Status
  app.get('/api/auth/spotify/me', async (req, res) => {
    const token = req.session?.spotify_token;
    if (!token) return res.json({ authenticated: false });

    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      res.json({ authenticated: true, user: response.data });
    } catch (error) {
      res.json({ authenticated: false });
    }
  });

  // Create Playlist
  app.post('/api/spotify/create-playlist', async (req, res) => {
    const token = req.session?.spotify_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated with Spotify' });

    const { name, description, songs } = req.body;

    try {
      // 1. Get User ID
      const meResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userId = meResponse.data.id;

      // 2. Search for each song to get URIs
      const trackUris: string[] = [];
      for (const song of songs) {
        const query = `track:${song.title} artist:${song.artist}`;
        const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { q: query, type: 'track', limit: 1 }
        });
        
        const track = searchResponse.data.tracks.items[0];
        if (track) {
          trackUris.push(track.uri);
        }
      }

      if (trackUris.length === 0) {
        return res.status(400).json({ error: 'No matching songs found on Spotify' });
      }

      // 3. Create Playlist
      const playlistResponse = await axios.post(`https://api.spotify.com/v1/users/${userId}/playlists`, 
        {
          name: name || 'VibeSync Playlist',
          description: description || 'Curated by VibeSync AI',
          public: false
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const playlistId = playlistResponse.data.id;

      // 4. Add Tracks to Playlist
      await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, 
        { uris: trackUris },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      res.json({ success: true, playlistUrl: playlistResponse.data.external_urls.spotify });
    } catch (error: any) {
      console.error('Playlist Creation Error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to create playlist' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
