'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Prevent direct static access to server internals or package manifests
app.use(['/server', '/package.json', '/package-lock.json'], (_req, res) => {
  res.status(404).send('Not found');
});

app.use(
  express.static(__dirname, {
    index: 'index.html',
    extensions: ['html'],
    dotfiles: 'ignore'
  })
);

app.listen(PORT, HOST, () => {
  console.log(`YourBrand PC Store running at http://${HOST}:${PORT}`);
});
