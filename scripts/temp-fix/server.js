// Simple server.js file for Azure Web App
const { createServer } = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const port = process.env.PORT || 8080;
const hostname = '0.0.0.0';

// Log startup info
console.log(`Starting server on port ${port}`);
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

// Simple server that serves static files from public directory
const server = createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  // Serve index.html for root path
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end('Error loading index.html');
        return;
      }
      
      res.setHeader('Content-Type', 'text/html');
      res.end(data);
    });
    return;
  }
  
  // Serve static files from public directory
  const filePath = path.join(__dirname, 'public', req.url);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // File not found, return 404
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    
    // Determine content type
    let contentType = 'text/plain';
    if (filePath.endsWith('.html')) contentType = 'text/html';
    if (filePath.endsWith('.css')) contentType = 'text/css';
    if (filePath.endsWith('.js')) contentType = 'text/javascript';
    if (filePath.endsWith('.json')) contentType = 'application/json';
    if (filePath.endsWith('.png')) contentType = 'image/png';
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
    
    // Stream the file
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

// Start the server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
