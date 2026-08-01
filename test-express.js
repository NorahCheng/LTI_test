const express = require('express');
const app = express();
app.use('*', (req, res) => res.send('ok'));
app.listen(3001, () => { console.log('started'); process.exit(0); });
