const https = require('https');

const appUrl = 'https://lookbook-nextjs-app.azurewebsites.net';

console.log(`Testing connection to ${appUrl}`);

https.get(appUrl, (res) => {
  let data = '';
  console.log(`Status code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received successfully');
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    console.log(`Body length: ${data.length} bytes`);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Application is deployed and responding correctly');
    } else {
      console.log('❌ Application is responding with an error status code');
    }
  });
}).on('error', (err) => {
  console.error('❌ Error connecting to application:');
  console.error(err);
}); 