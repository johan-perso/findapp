// Fonction pour mettre à jour le cache
async function updateCache(){
	await caches.open('findapp-cache').then(cache => {
		return cache.addAll([
			'https://fonts.googleapis.com/css?family=Roboto:300,400,500',
			'https://fonts.googleapis.com/css?family=Material+Icons&display=block',
			'https://egkoppel.github.io/product-sans/css/product-sans-500-all.css',
			'https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css',
			'https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js',
			'https://raw.githubusercontent.com/johan-perso/findapp/main/public/screenshots/findapp-exempleSourceJson.png',
			'https://raw.githubusercontent.com/johan-perso/findapp/main/public/icons/rounded.png',
			'https://raw.githubusercontent.com/johan-perso/findapp/main/public/icons/APK_defaultIcon.png',
			'/',
			'/help',
			'/source',
			'/style.css',
			'/script/main.js',
			'/script/sw.js',
			'/script/replaceLinkInPWA.js',
			'/script/importSW.js',
			'/manifest.json',
			'/favicon.png',
			'/icons/full.png',
			'/icons/rounded.png'
		])
	})

	// Retourner true
	return true;
}

// Quand le service worker est "installé"
self.addEventListener('install', () => {
	// Afficher que le service worker est installé
	console.log('[SW.js] "install" reçu');
});
self.addEventListener("activate", () => {
	// Afficher que le service worker est activé
	console.log('[SW.js] "activate" reçu');
});

// Lors d'une requête
self.addEventListener("fetch", event => {
	// Retourner une requête par réseau, et si ça marche pas, essayer via le cache
	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		})
	);
});

// Si on reçois l'instruction de mettre à jour le cache
self.addEventListener('message', async event => {
	console.log('[SW.js] "message" reçu : ' + event.data);

	if(event.data === 'updateCache'){
		// Mettre à jour le cache
		await updateCache()

		// Envoyer à la page que c'est bon
		event.source.postMessage("updateCacheDone");
	}
});
