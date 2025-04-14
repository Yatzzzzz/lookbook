const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// For debugging
console.log(`Starting server... Node version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`PORT environment variable: ${process.env.PORT || 'not set'}`);

try {
  // Azure Web App expects port 8080
  const port = process.env.PORT || 8080;
  
  // Bind to all interfaces (important for Azure)
  const hostname = '0.0.0.0';
  
  // Development mode or production mode
  const dev = process.env.NODE_ENV !== 'production';
  
  // Initialize Next.js
  console.log('Initializing Next.js app...');
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  
  // Prepare Next.js
  app.prepare()
    .then(() => {
      console.log('Next.js app prepared successfully');
      
      // Create HTTP server
      const server = createServer((req, res) => {
        try {
          // Parse URL
          const parsedUrl = parse(req.url, true);
          
          // Log incoming request
          console.log(`Incoming request: ${req.method} ${parsedUrl.pathname}`);
          
          // Let Next.js handle the request
          handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error handling request:', err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });
      
      // Handle server errors
      server.on('error', (err) => {
        console.error('Server error:', err);
      });
      
      // Start listening
      server.listen(port, hostname, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log('Server is now running!');
      });
    })
    .catch((err) => {
      console.error('Error preparing Next.js app:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Fatal error initializing app:', err);
  process.exit(1);
}
