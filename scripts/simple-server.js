// Simple HTTP server for testing Azure App Service deployment
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const port = process.env.PORT || 8080;
const hostname = '0.0.0.0';

// Create server
const server = http.createServer((req, res) => {
  // Get system info for debugging
  const nodeVersion = process.version;
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const cpuInfo = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  
  // Get environment variables
  const env = process.env;
  
  // Get directory contents
  let dirContents = '';
  try {
    const dir = fs.readdirSync('.');
    dirContents = `Directory contents: ${dir.join(', ')}`;
  } catch (err) {
    dirContents = `Error reading directory: ${err.message}`;
  }
  
  // Create HTML response
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Azure App Service - Test Server</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #0078D4; }
    h2 { color: #333; margin-top: 30px; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .container { max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Azure App Service - Server Running!</h1>
    <p>This simple server is running successfully on Azure App Service.</p>
    
    <h2>System Information</h2>
    <pre>
Node Version: ${nodeVersion}
Server Uptime: ${uptime.toFixed(2)} seconds
Hostname: ${os.hostname()}
Platform: ${os.platform()} ${os.release()}
Architecture: ${os.arch()}
CPUs: ${cpuInfo.length}
Total Memory: ${(totalMemory / (1024 * 1024 * 1024)).toFixed(2)} GB
Free Memory: ${(freeMemory / (1024 * 1024 * 1024)).toFixed(2)} GB
    </pre>
    
    <h2>Directory Contents</h2>
    <pre>${dirContents}</pre>
    
    <h2>Environment Variables</h2>
    <pre>
PORT: ${env.PORT || 'Not set'}
NODE_ENV: ${env.NODE_ENV || 'Not set'}
WEBSITE_SITE_NAME: ${env.WEBSITE_SITE_NAME || 'Not set'}
WEBSITE_HOSTNAME: ${env.WEBSITE_HOSTNAME || 'Not set'}
WEBSITE_INSTANCE_ID: ${env.WEBSITE_INSTANCE_ID || 'Not set'}
    </pre>
    
    <h2>Request Information</h2>
    <pre>
URL: ${req.url}
Method: ${req.method}
Headers: ${JSON.stringify(req.headers, null, 2)}
    </pre>
  </div>
</body>
</html>
  `;
  
  // Send response
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

// Start server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log(`Node Version: ${process.version}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`PORT: ${process.env.PORT || 'Not set'}`);
  console.log(`Current Directory: ${process.cwd()}`);
  
  try {
    const files = fs.readdirSync('.');
    console.log(`Files in directory: ${files.join(', ')}`);
  } catch (err) {
    console.error(`Error reading directory: ${err.message}`);
  }
}); 