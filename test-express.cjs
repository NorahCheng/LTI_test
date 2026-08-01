const express = require('express');
const app = express();
try {
  app.use('*', (req, res) => res.send('ok'));
  console.log('use * worked');
} catch (e) {
  console.log('use * failed:', e.message);
}
try {
  app.get('*', (req, res) => res.send('ok'));
  console.log('get * worked');
} catch (e) {
  console.log('get * failed:', e.message);
}
