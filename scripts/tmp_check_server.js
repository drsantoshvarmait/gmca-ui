import http from 'http';

http.get('http://localhost:5173', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', () => {});
  res.on('end', () => { process.exit(0); });
}).on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
  process.exit(1);
});
