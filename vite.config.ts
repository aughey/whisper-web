import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Connect, ViteDevServer } from 'vite'
import { WebSocket, WebSocketServer } from 'ws'
import type { IncomingMessage, ServerResponse } from 'http'
import { EventEmitter } from 'events'
import { createProxyMiddleware } from 'http-proxy-middleware'

// Array to store transcriptions
let transcriptions: { text: string; timestamp: string }[] = [];
// Store WebSocket connections
const wsConnections = new Set<WebSocket>();
// Store WebSocket server instance
let wss: WebSocketServer | null = null;
// Event emitter for transcription events
const transcriptionEvents = new EventEmitter();
// Track if transcription is currently active
let transcriptionActive = false;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-server',
      configureServer(server: ViteDevServer) {
        // Create WebSocket server if it doesn't exist
        if (!wss) {
          wss = new WebSocketServer({ noServer: true });

          // Handle WebSocket connections
          wss.on('connection', (ws) => {
            console.log('New WebSocket connection');
            wsConnections.add(ws);

            ws.on('error', (error) => {
              console.error('WebSocket error:', error);
            });

            ws.on('close', () => {
              console.log('Client disconnected');
              wsConnections.delete(ws);
            });
          });

          // Handle upgrade requests
          server.httpServer?.on('upgrade', (request, socket, head) => {
            if (request.url === '/ws') {
              wss?.handleUpgrade(request, socket, head, (ws) => {
                wss?.emit('connection', ws, request);
              });
            }
          });
        }

        // Add proxy middleware for /api2/transcription
        server.middlewares.use('/api2/transcription', createProxyMiddleware({
          target: 'http://127.0.0.1:9999',
          changeOrigin: true,
          secure: false,
          ws: false
        }));

        // API routes
        server.middlewares.use('/api/transcription', (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const { text } = JSON.parse(body);
                const timestamp = new Date().toISOString();
                console.log(text);
                const transcription = { text, timestamp };
                transcriptions.push(transcription);

                // Emit the transcription event with the text
                transcriptionEvents.emit('transcription', transcription);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, timestamp }));
              } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request body' }));
              }
            });
          } else if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(transcriptions));
          } else {
            next();
          }
        });

        // Toggle transcription endpoint
        server.middlewares.use('/api/toggle', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method === 'POST') {
            // Toggle the transcription state
            transcriptionActive = !transcriptionActive;

            // Prepare and send the appropriate command
            const command = transcriptionActive ? 'transcribe-start' : 'transcribe-stop';
            const message = JSON.stringify({ command });

            // Broadcast message to all connected clients
            wsConnections.forEach((ws) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
              }
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              transcriptionActive,
              message: `Transcription ${transcriptionActive ? 'started' : 'stopped'}`
            }));
          } else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        });

        // Start transcription endpoint
        server.middlewares.use('/api/start', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method === 'POST') {
            // Broadcast start message to all connected clients
            const message = JSON.stringify({ command: 'transcribe-start' });
            wsConnections.forEach((ws) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
              }
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Transcription started' }));
          } else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        });

        // Stop transcription endpoint
        server.middlewares.use('/api/stop', (req: IncomingMessage, res: ServerResponse) => {
          if (req.method === 'POST') {
            // Broadcast stop message to all connected clients
            const message = JSON.stringify({ command: 'transcribe-stop' });
            wsConnections.forEach((ws) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
              }
            });

            // Set up a timeout for the transcription wait
            const timeoutMs = 30000; // 30 seconds timeout
            const timeout = setTimeout(() => {
              transcriptionEvents.removeAllListeners('transcription');
              res.writeHead(408, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Timeout waiting for transcription',
                success: false
              }));
            }, timeoutMs);

            // Wait for the next transcription event
            transcriptionEvents.once('transcription', (transcription) => {
              clearTimeout(timeout);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: 'Transcription stopped',
                transcription
              }));
            });
          } else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
        });
      }
    }
  ],
})
