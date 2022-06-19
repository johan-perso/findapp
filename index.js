// Importer quelques librairies
const fs = require('fs');
const path = require('path');

// Préparer un serveur web avec express.js
const express = require('express');
const app = express();
app.disable('x-powered-by');

// Route de sources d'applis - NE PAS SERVIR SI UTILISATION DE VERCEL, certains fichiers dépasse la limite de 6 MB : utiliser une autre plateforme (genre Firebase)
// app.use('/sourceList', express.static(path.join(__dirname, 'public', 'sources')));

// Version de FindApp
app.get('/version', (req, res) => {
	res.send(require('./package.json').version);
})

// Route - page d'accueil
app.get(['/','/index'], async (req, res) => {
	res.send(fs.readFileSync(path.join(__dirname, 'public', 'index.html')).toString())
})

// Route - page d'aide
app.get('/help', async (req, res) => {
	res.send(fs.readFileSync(path.join(__dirname, 'public', 'help.html')).toString())
})

// Route - source
app.get('/source', async (req, res) => {
	res.send(fs.readFileSync(path.join(__dirname, 'public', 'source.html')).toString())
})

// Route - Style, script, service worker, manifest, icône
app.get('/style.css', async (req, res) => {
	res.set('Content-Type', 'text/css').send(fs.readFileSync(path.join(__dirname, 'public', 'style.css')).toString())
})
app.get('/sw.js', async (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'script', 'sw.js'))
})
app.get('/manifest.json', async (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'manifest.json'))
})
app.get('/favicon.png', async (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'icons', 'rounded.png'))
})
app.use('/icons', express.static(path.join(__dirname, 'public', 'icons')));
app.use('/script', express.static(path.join(__dirname, 'public', 'script')));


// Routes - erreur 404
app.get('*', async (req, res) => {
	res.send(fs.readFileSync(path.join(__dirname, 'public', '404.html')).toString())
})
app.post('*', async (req, res) => {
	res.send({ error: true, message: "Route non trouvé" });
})

// Démarrer le serveur web
const server = app.listen(process.env.PORT || 8000, () => {
	console.log(`Serveur web démarré sur le port ${server.address().port}`);
});