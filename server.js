const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create logs directory:', err);
}

// Custom logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  console.log(logMessage);
  
  try {
    fs.appendFileSync(path.join(logDir, 'server.log'), logMessage + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

// Log startup information
log('Server starting...');
log(`Node version: ${process.version}`);
log(`Environment: ${process.env.NODE_ENV || 'development'}`);
log(`Current directory: ${__dirname}`);
log(`Files in directory: ${fs.readdirSync(__dirname).join(', ')}`);

// Azure Web Apps uses port 8080 by default
const port = parseInt(process.env.PORT, 10) || 8080;
// In production, we're not in development mode
const dev = process.env.NODE_ENV !== 'production';
// Bind to all interfaces
const hostname = '0.0.0.0';

log(`Using port: ${port}`);
log(`Dev mode: ${dev}`);
log(`Using hostname: ${hostname}`);

// Create Next.js app instance
try {
  log('Initializing Next.js...');
  const app = next({ dev, dir: __dirname });
  const handle = app.getRequestHandler();

  app.prepare()
    .then(() => {
      log('Next.js prepared successfully');
      
      // Create HTTP server
      const server = createServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url, true);
          log(`Request: ${req.method} ${parsedUrl.pathname}`);
          
          await handle(req, res, parsedUrl);
        } catch (err) {
          log(`Error handling request: ${err.message}`);
          console.error(err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });

      server.on('error', (err) => {
        log(`Server error: ${err.message}`);
        console.error(err);
      });

      // Start listening
      server.listen(port, hostname, (err) => {
        if (err) {
          log(`Failed to start server: ${err.message}`);
          console.error(err);
          throw err;
        }
        log(`> Ready on http://${hostname}:${port}`);
        log('Server successfully started');
      });
    })
    .catch((err) => {
      log(`Error preparing Next.js app: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
} catch (err) {
  log(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
} 