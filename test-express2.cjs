const express = require('express');
const app = express();
try {
  app.get('*all', (req, res) => res.send('ok'));
  console.log('get *all worked');
} catch (e) {
  console.log('get *all failed:', e.message);
}
try {
  app.get('(.*)', (req, res) => res.send('ok'));
  console.log('get (.*) worked');
} catch (e) {
  console.log('get (.*) failed:', e.message);
}
