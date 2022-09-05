// Préparer quelques trucs pour le Material Design pour plus tard
var MDCSnackbar;
var MDCDialog;

// Fonction pour vérifier si le site est installé en tant que PWA
function isInstalled(){
	// Pour iOS
	if(window.navigator.standalone) return true

	// Pour Android (et potentiellement d'autres systèmes PC)
	if(window.matchMedia('(display-mode: standalone)').matches) return true

	// Si c'est aucun des deux, moi j'pense que la question est vite répondue
	return false
}

// Obtenir si on est sur téléphone/tablette, ou PC
function deviceType(){
	// Obtenir l'agent utilisateur
    const ua = navigator.userAgent;

	// Si on est sur téléphone/tablette
    if(/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "phone";
	if(/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "phone";

	// Sinon, on est sur PC
    return "desktop";
}

// Fonction pour crée un template de signalement
function createReportTemplate(){
	// Crée un formatteur
	const formatter = new Intl.ListFormat('fr', { style: 'long', type: 'conjunction' });

	// Obtenir la raison
	var reason = (document.getElementById('reportProblem-radio1')?.checked) ? document.querySelector('[for=reportProblem-radio1]')?.textContent : false || (document.getElementById('reportProblem-radio2')?.checked) ? document.querySelector('[for=reportProblem-radio2]')?.textContent : false || (document.getElementById('reportProblem-radio3')?.checked) ? document.querySelector('[for=reportProblem-radio3]')?.textContent : false

	// Obtenir les plateformes
	var platforms = [ document.getElementById('reportProblem-checkbox1'), document.getElementById('reportProblem-checkbox2'), document.getElementById('reportProblem-checkbox3'), document.getElementById('reportProblem-checkbox4') ].filter(e => e?.checked).map(p => document.querySelector(`[for=${p.id}]`)?.textContent)

	// Retourner le template
	return `Salut, par rapport à FindApp v${localStorage.getItem('version')}, j'ai un problème :\n\n- Raison : ${reason}\n- Stores : ${formatter.format(platforms)}\n(vous pouvez ajouter des informations complémentaires)`;
}

// Fonction pour ouvrir un lien
function openLink(link){
	// Si le site est une PWA
	if(isInstalled()) window.open(link);

	// Sinon
	else window.location.href = link
}

// Quand la page à fini de charger
window.onload = async function(){
	// Préparer le material design
		// Quelques "importations"
		MDCSnackbar = mdc.snackbar.MDCSnackbar
		MDCDialog = mdc.dialog.MDCDialog

	// Si on est hors ligne, afficher un snackbar
	if(!navigator.onLine) showSnackbar("Aucune connexion internet", 'Réessayer', 'window.location.reload()');

	// Si il y a un hash
	if(window.location.hash) window.dispatchEvent(new HashChangeEvent("hashchange"))

	// Si aucune source n'est présente, ajouter la liste par défaut
	if(!localStorage.getItem('sources') || (localStorage.getItem('sources') && JSON.parse(localStorage.getItem('sources')) && !JSON.parse(localStorage.getItem('sources')).length)){
		console.log('Ajout de la liste par défaut')
		localStorage.setItem('sources', JSON.stringify([ 'https://raw.githubusercontent.com/johan-perso/findapp/main/public/sources/pwa.json', 'https://raw.githubusercontent.com/johan-perso/findapp/main/public/sources/nativesApps.json' ]))
		mergeAllSources()
	}

	// Si on est sur la page des sources
	if(window.location.pathname.startsWith('/source')){
		// Si des sources sont présente dans la liste, afficher la table
		if(localStorage.getItem('sources') && JSON.parse(localStorage.getItem('sources')) && JSON.parse(localStorage.getItem('sources')).length > 0){
			// Obtenir la liste des sources
			var sources = JSON.parse(localStorage.getItem('sources'))

			// Nettoyer la liste
				// Supprimer tout les élements en double
				sources = sources.filter((e, i) => sources.indexOf(e) == i)

				// Supprimer tout les élements vides
				sources = sources.filter(e => e && e?.length)

				// Si on a rien après nettoyage, arrêter
				localStorage.setItem('sources', JSON.stringify(sources))
				if(sources.length == 0) return

			// Afficher la barre de chargement progressif
			document.getElementById('loadingProgressContainer').classList.remove('hidden')

			// Ajouter tout les élements
			for(var i = 0; i < sources.length; i++){
				document.getElementById('listSourcesTbody').insertAdjacentHTML('beforeend', `<tr sourceName="${encodeURIComponent(sources[i])}" class="mdc-data-table__row"><th width="50%" style="color: #dee2e6;" class="mdc-data-table__cell" scope="row">${escapeHTML(capitalizeFirstLetter((await fetchSource(sources[i])).name))}</th><td width="50%" style="color: #dee2e6;" class="mdc-data-table__cell sourceLink">${escapeHTML(sources[i])}</td><td nowrap style="color: #dee2e6;" class="mdc-data-table__cell"><button class="mdc-button mdc-button--raised" onclick="showSourceDetails(this.parentElement.parentElement.querySelector('.sourceLink').innerText)"><span class="mdc-button__ripple"></span>Afficher</button>\n<button class="mdc-button mdc-button--raised" onclick="navigator.share({ title: 'Source FindApp', url: '${location.origin}#addsource-${escapeHTML(sources[i])}' })"><span class="mdc-button__ripple"></span>Partager</button>\n<button class="mdc-button mdc-button--raised" onclick="removeSource(this.parentElement.parentElement.querySelector('.sourceLink').innerText)"><span class="mdc-button__ripple"></span>Supprimer</button></td></tr>`)
				document.getElementById('loadingProgress').style.width = ((i+1) / sources.length * 100) + '%'
			}

			// Remasquer la barre de chargement progressif
			document.getElementById('loadingProgressContainer').classList.add('hidden')

			// Afficher la table
			document.getElementById('listSources').style.display = ''

			// Fusionner toute les sources en un élement du stockage
			mergeAllSources()
		}
	}
}

// Quand le hash de la page change
window.onhashchange = function(){
	// Si il commence par search-
	if(window.location.hash.startsWith('#search-')){
		// Obtenir le hash
		var hash = window.location.hash.substring(8);

		// Si le hash est vide
		if(hash == ''){
			// On affiche la page d'accueil
			window.location.hash = '#home';
		}

		// Sinon
		else {
			document.getElementById('searchTerm').value = decodeURI(hash);
			searchApps(hash);
		}
	}

	// Si le hash commence par app-
	if(window.location.hash.startsWith('#app-')){
		// Obtenir le hash
		var hash = window.location.hash.substring(5);

		// Si le hash est vide
		if(hash == ''){
			// On affiche la page d'accueil
			window.location.hash = '#home';
		}

		// Sinon
		else showApp(hash);
	}

	// Si le hash commence par addsource-
	if(window.location.hash.startsWith('#addsource-')){
		// Obtenir le hash
		var hash = window.location.hash.substring(11);

		// Si le hash est vide
		if(hash == ''){
			window.location.hash = '#home';
		}

		// Sinon
		else promptAddSource(hash);
	}

	// Si le hash commence par home
	if(window.location.hash.startsWith('#home')){
		// Enlever certains éléments de la page
		document.getElementById('app-container').childNodes.forEach(e => e.remove());
		document.getElementById("appInfo_div")?.classList.add('hidden')
	}
}

// Si on appuie sur la touche entrer
window.onkeydown = function(e){
	// Si on a le focus sur l'input de recherche
	if(e.keyCode == 13 && document.activeElement.id === 'searchTerm'){
		e.preventDefault();
		window.location.hash = '#search-' + document.getElementById('searchTerm').value
	}

	// Si on a le focus sur l'input d'ajout d'une source
	if(e.keyCode == 13 && document.activeElement.id === 'sourceLink'){
		e.preventDefault();
		addSource(document.getElementById('sourceLink').value)
	}
}

// Fonction pour empêcher des attaques XSS basique dans un string
function escapeHTML(string){
	return string?.replace(/&/g, "&amp;")?.replace(/</g, "&lt;")?.replace(/>/g, "&gt;")?.replace(/"/g, "&quot;")?.replace(/'/g, "&#039;");
}

// Fonction pour mettre en majuscule la première lettre d'un string
function capitalizeFirstLetter(string){
	if(!string) return string;
	return (string.charAt(0).toUpperCase() + string.slice(1)) || string
}

// Fonction pour ajouter une source via un modal
function promptAddSource(sourceUrl){
	// Si un modal est déjà sur la page, l'enlever
	if(document.querySelector('.mdc-dialog')) document.querySelector('.mdc-dialog').remove();

	// Ajouter le modal sur la page
	document.body.innerHTML += `<div class="mdc-dialog"><div class="mdc-dialog__container"><div class="mdc-dialog__surface" role="alertdialog" aria-modal="true"><h2 class="mdc-dialog__title">Ajouter une source</h2><div class="mdc-dialog__content space-y-2"><div><p>Voulez-vous ajouter la source <b>"${escapeHTML(sourceUrl)}"</b> ?<br><br>L'ajout de cette source permettra d'ajouter de nouvelles applications dans les résultats de recherches<br>Vous pouvez voir et modifier vos sources depuis <a class="text-blue-400" href="/source">la page associée</a>.</p></div></div><div class="mdc-dialog__actions"><button onclick="addSourceFromModal('${escapeHTML(sourceUrl)}')" class="mdc-button mdc-dialog__button"data-mdc-dialog-action="discard"><div class="mdc-button__ripple"></div><span class="mdc-button__label">Ajouter</span></button><button class="mdc-button mdc-dialog__button" data-mdc-dialog-action="discard"><div class="mdc-button__ripple"></div><span class="mdc-button__label">Annuler</span></button></div></div></div></div><div class="mdc-dialog__scrim"></div></div>`

	// "ouvrir" le modal
	new MDCDialog(document.querySelector('.mdc-dialog')).open();
}

// Fonction pour ajouter une source DEPUIS un modal
async function addSourceFromModal(sourceUrl){
	// Fermer le modal
	if(document.querySelector('.mdc-dialog')) document.querySelector('.mdc-dialog').remove()

	// Ajouter la source
	await addSource(sourceUrl)

	// Ajouter un toast
	showSnackbar("Source ajouté avec succès !", 'Voir les applications', `showSourceDetails('${escapeHTML(sourceUrl)}')`)
}

// Fonction pour générer une carte d'appli
function generateCard(name, packageName, icon, platforms, forSkeleton=false){
	// Crée un formatteur
	const formatter = new Intl.ListFormat('fr', { style: 'long', type: 'conjunction' });

	// Mettre en gras chaque plateforme
	if(platforms) platforms = platforms.map(platform => {
		return `<b>${escapeHTML(platform?.name)}</b>`
	}); else var platforms = ['<b>Internet</b>']

	// Générer la carte
	var card = `<li class="py-3 sm:py-4%MORE_CLASS%"><div class="flex items-center space-x-4"><div class="flex-shrink-0">%ICON%</div><div class="flex-1 min-w-0 space-y-1" isCardTitle><p class="text-sm font-medium truncate text-white" id="cardName_${packageName}" isCardName>%NAME%</p><p class="text-sm truncate text-gray-400" id="cardPlatform_${packageName}" isCardPlatforms>%PLATFORMS%</p></div><div class="inline-flex items-center text-base font-semibold text-white" isCardButton>%BUTTON%</div></div></li>`

	// Retourner la carte
	if(!forSkeleton) return card.replace('%NAME%', escapeHTML(name)).replace('%PLATFORMS%', `Disponible sur ${formatter.format(platforms)}.`).replace('%BUTTON%', `${window.innerWidth > 560 ? `<button isCardButton onclick="navigator.share({ title: '${escapeHTML(name)}', url: '${location.origin}#app-${escapeHTML(packageName)}' })" class="mdc-button mdc-button--raised mr-2"><span class="mdc-button__ripple"></span><span class="mdc-button__label">Partager</span></button>` : ''}<a isCardButton href="#app-${packageName}" class="mdc-button mdc-button--raised"><span class="mdc-button__ripple"></span><span class="mdc-button__label">Afficher</span></a>`).replace('%ICON%', `<img onerror="this.src = 'https://raw.githubusercontent.com/johan-perso/findapp/main/public/icons/APK_defaultIcon.png'" class="w-12 h-12 rounded-full hover:rounded-2xl" src="${icon}" alt="">`).replace('%MORE_CLASS%', '');
	if(forSkeleton) return card.replace('%NAME%', '<div class="animate-pulse bg-base-200 w-32 h-4"></div>').replace('%PLATFORMS%', '<div class="animate-pulse bg-base-200 w-64 h-4"></div>').replace('%BUTTON%', '').replace('%ICON%', '<div class="animate-pulse bg-base-200 rounded-full hover:rounded-2xl w-12 h-12"></div>').replace('%MORE_CLASS%', ' skeleton');
}

// Fonction pour afficher un formulaire de signalement de problèmes
function showReportForm(){
	// Si un formulaire est déjà sur la page, l'enlever
	if(document.querySelector('.mdc-dialog')) document.querySelector('.mdc-dialog').remove();

	// Ajouter le formulaire sur la page
	document.body.innerHTML += `<div class="mdc-dialog"><div class="mdc-dialog__container"><div class="mdc-dialog__surface" role="alertdialog" aria-modal="true"><h2 class="mdc-dialog__title">Signaler un problème</h2><div class="mdc-dialog__content space-y-2"><div><h3>Sélectionner la raison du signalement :</h3><div class="mdc-form-field"><div class="mdc-radio"><input id="reportProblem-radio1" class="mdc-radio__native-control" type="radio" name="radios" checked><div class="mdc-radio__background"><div class="mdc-radio__outer-circle"></div><div class="mdc-radio__inner-circle"></div></div><div class="mdc-radio__ripple"></div></div><label for="reportProblem-radio1">Mauvaise version/appli manquante</label></div><br><div class="mdc-form-field"><div class="mdc-radio"><input id="reportProblem-radio2" class="mdc-radio__native-control" type="radio" name="radios"><div class="mdc-radio__background"><div class="mdc-radio__outer-circle"></div><div class="mdc-radio__inner-circle"></div></div><div class="mdc-radio__ripple"></div></div><label for="reportProblem-radio2">Application malveillante</label></div><br><div class="mdc-form-field"><div class="mdc-radio"><input id="reportProblem-radio3" class="mdc-radio__native-control" type="radio" name="radios"><div class="mdc-radio__background"><div class="mdc-radio__outer-circle"></div><div class="mdc-radio__inner-circle"></div></div><div class="mdc-radio__ripple"></div></div><label for="reportProblem-radio3">Autres</label></div><br></div><div><h3>Store en question :</h3><div class="mdc-form-field"><div class="mdc-checkbox"><input id="reportProblem-checkbox1" type="checkbox" class="mdc-checkbox__native-control"/><div class="mdc-checkbox__background"><svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"/></svg><div class="mdc-checkbox__mixedmark"></div></div><div class="mdc-checkbox__ripple"></div></div><label for="reportProblem-checkbox1">AppGallery</label></div><br><div class="mdc-form-field"><div class="mdc-checkbox"><input id="reportProblem-checkbox2" type="checkbox" class="mdc-checkbox__native-control"/><div class="mdc-checkbox__background"><svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"/></svg><div class="mdc-checkbox__mixedmark"></div></div><div class="mdc-checkbox__ripple"></div></div><label for="reportProblem-checkbox2">ApkPure</label></div><br><div class="mdc-form-field"><div class="mdc-checkbox"><input id="reportProblem-checkbox3" type="checkbox" class="mdc-checkbox__native-control"/><div class="mdc-checkbox__background"><svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"/></svg><div class="mdc-checkbox__mixedmark"></div></div><div class="mdc-checkbox__ripple"></div></div><label for="reportProblem-checkbox3">Aptoide</label></div><br><div class="mdc-form-field"><div class="mdc-checkbox"><input id="reportProblem-checkbox4" type="checkbox" class="mdc-checkbox__native-control"/><div class="mdc-checkbox__background"><svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"/></svg><div class="mdc-checkbox__mixedmark"></div></div><div class="mdc-checkbox__ripple"></div></div><label for="reportProblem-checkbox4">F-Droid</label></div><br></div></div><div class="mdc-dialog__actions"><button onclick="navigator.clipboard.writeText(createReportTemplate()) & showSnackbar('Copié dans le presse papier', 'Contacter', 'openLink(\`https:\/\/contact.johanstick.me\`)') & document.querySelector('.mdc-dialog').remove()" type="button" class="mdc-button mdc-dialog__button" data-mdc-dialog-action="discard"><div class="mdc-button__ripple"></div><span class="mdc-button__label">Copier un template</span></button><button onclick="openLink(\`https:\/\/twitter.com/messages/compose?recipient_id=975789391594557440&text=${encodeURI(createReportTemplate())}\`) & document.querySelector('.mdc-dialog').remove()" type="button" class="mdc-button mdc-dialog__button" data-mdc-dialog-action="discard"><div class="mdc-button__ripple"></div><span class="mdc-button__label">Signaler</span></button></div></div></div><div class="mdc-dialog__scrim"></div></div>`

	// "ouvrir" le formulaire
	new MDCDialog(document.querySelector('.mdc-dialog')).open();
}

// Fonction pour afficher le menu d'installation d'une application
function showDownloadForm(platformName, platformLink, apkLink){
	// Si un formulaire est déjà sur la page, l'enlever
	if(document.querySelector('.mdc-dialog')) document.querySelector('.mdc-dialog').remove();

	// Ajouter le formulaire sur la page
	document.body.innerHTML += `<div class="mdc-dialog"><div class="mdc-dialog__container"><div class="mdc-dialog__surface" role="alertdialog" aria-modal="true"><h2 class="mdc-dialog__title">Télécharger l'application</h2><div class="mdc-dialog__content space-y-2"><div><p>Vous avez la possibilité de :<ul class="list-inside list-disc"><li>Télécharger un fichier d'installation .apk</li><li>Télécharger depuis la page du site d'${platformName.replace('FDroid','F-Droid')}</li>${(deviceType() == 'desktop') ? '<li>Scanner le QR Code depuis votre téléphone</li>' : ''}</ul></p>${(deviceType() == 'desktop' ? `<img width="${parseInt(window.innerWidth / 3)}" class="mx-auto w-full max-w-sm" src="https://chart.googleapis.com/chart?cht=qr&chs=256x256&chl=${encodeURI(window.location.href)}">` : '')}</div></div><div class="mdc-dialog__actions"><a href="${apkLink}" type="button" class="mdc-button mdc-dialog__button" data-mdc-dialog-action="discard"><div class="mdc-button__ripple"></div><span class="mdc-button__label">Télécharger l'APK</span></button><a href="${platformLink}" type="button" class="mdc-button mdc-dialog__button" data-mdc-dialog-action="discard"><div class="mdc-button__ripple"></div><span class="mdc-button__label">Ouvrir ${platformName.replace('FDroid','F-Droid')}</span></button></div></div></div><div class="mdc-dialog__scrim"></div></div>`

	// "ouvrir" le formulaire
	new MDCDialog(document.querySelector('.mdc-dialog')).open();
}

// Fonction pour afficher une application
async function showApp(packageName){
	// Récupérer les informations de l'application
		// Obtenir à partir du stockage de la session
		var app = {}
		app = sessionStorage.getItem(packageName)

		// Si aucune information n'est trouvée, obtenir à partir de l'API
		if(app == null){
			app = await getApp(packageName)
			if(app.error) return showSnackbar(app.message || "Impossible d'obtenir des détails sur l'application", "Fermer", "")
		} else {
			app = JSON.parse(app)
		}

		// Si c'est une erreur
		if(app.error) return showSnackbar(app.message || "Impossible d'obtenir des détails sur l'application", "Fermer", "")

	// Supprimer les anciennes applications
	document.getElementById("appInfo_div")?.classList.add('hidden')

	// Préparer le code des informations détaillées
	if(app.packageName) var appDetails = `<li class="flex"><div><svg class="mr-2" width="22" height="22" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="truncate"><b>Nom du packet :</b>&nbsp;${escapeHTML(packageName)}</div></li>`;
	else var appDetails = `<li class="flex"><div><svg class="mr-2" width="22" height="22" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="truncate"><b>Lien :</b>&nbsp;<a class="text-blue-400" href="${escapeHTML(app.link.replace(/"/g,'\"'))}">${escapeHTML(app.link)}</a></div></li>`

	// Condition réseaux (pour les PWA)
	if(app.connectivityType) appDetails += `<li class="flex"><div><svg class="mr-2" width="22" height="22" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="truncate"><b>Conditions réseaux :</b>&nbsp;${app.connectivityType.replace('worksOffline','Fonctionne hors connexion').replace('onlineOnly','Uniquement connecté à Internet')}</div></li>`

	// Générer la liste des boutons
		// Préparer l'array
		var buttons = []

		// Si c'est une PWA (contient UN lien et non plusieurs)
		if(app.link) buttons.push(`<a href="${escapeHTML(app.link.replace(/'/g, "\'"))}" class="mt-1 w-full sm:max-w-max mdc-button mdc-button--raised"><span class="mdc-button__ripple"></span><span class="mdc-button__label">Ouvrir</span></button>`)

		// Si il y a plusieurs plateformes
		if(app.links) for(var link of app.links){
			buttons.push(`<button onclick="showDownloadForm('${escapeHTML(link?.name?.replace(/'/g, "\'").replace(/"/g,'\"'))}', '${escapeHTML(link?.platformLink?.replace(/'/g, "\'").replace(/"/g,'\"'))}', '${escapeHTML(link?.apkLink?.replace(/'/g, "\'").replace(/"/g,'\"'))}')" class="mt-1 w-full max-w-fit sm:max-w-max mdc-button mdc-button--raised"><span class="mdc-button__ripple"></span><span class="mdc-button__label">${escapeHTML(link?.name)}</span></button>`)
		}

	// Générer le code de la carte
	var code = `<div id="appInfo" class="px-6 py-2"><div class="px-4 py-8 bg-base-100 rounded-lg border shadow-md sm:px-8 border-base-300"><div class="flex items-center space-x-4"><div class="flex-shrink-0"><img onerror="this.src = 'https://raw.githubusercontent.com/johan-perso/findapp/main/public/icons/APK_defaultIcon.png'" class="w-12 h-12 rounded-full hover:rounded-2xl" src="${app.icon || 'https://raw.githubusercontent.com/johan-perso/findapp/main/public/icons/APK_defaultIcon.png'}" alt=""></div><div class="flex-1 min-w-0"><p class="text-md font-medium truncate text-white">${escapeHTML(app.name)}</p><p class="text-sm text-gray-400" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHTML(app.description) || 'Aucune description disponible'}</p></div></div><div class="mt-3"><p class="text-lg text-gray-400 font-bold mb-1">Informations :</p><ul class="list-inside list-none">${appDetails}</ul></div><div class="mt-2">${(app.links) ? '<p class="text-lg text-gray-400 font-bold mb-1">Télécharger via :</p>' : ''}<div>${buttons.join(' ')}</div></div></div></div>`

	// Afficher l'application
	document.getElementById('appList_div').classList.add('hidden')
	document.getElementById('app-container').innerHTML = code
}

// Fonction pour chercher une application
var allApplications;
async function searchApps(query){
	// Si aucun texte n'est donné, ou qu'il est trop court
	if(!query || query.length < 1) return loadingSearchButton('remove') & showSnackbar('Terme de recherche trop court', 'Fermer', '');

	// Désactiver le bouton (le rendre en mode chargement)
	loadingSearchButton('add');

	// Supprimer tout les élements d'appList
	while(document?.getElementById('appList')?.firstChild) document?.getElementById('appList')?.removeChild(document?.getElementById('appList')?.firstChild);

	// Ajouter quelques applis (pour former un squelette)
	for(var i = 0; i < 10; i++){
		// Préparer une carte
		var card = generateCard('', '', '', [], true);

		// Ajouter la carte
		document.getElementById('appList').innerHTML += card;
	}

	// Rendre visible la liste des applis
	document.getElementById("appList_div")?.classList.remove('hidden')

	// Préparer la recherche
		// Si la recherche est déjà dans le stockage de session
		if(sessionStorage.getItem(`search-${query}`)) var results = JSON.parse(sessionStorage.getItem(`search-${query}`));

		// Obtenir le nombre maximum d'application à obtenir (calculer par rapport à la taille de l'écran)
		if(query == 'all') var max = parseInt(window.innerHeight / 4);
		else var max = parseInt(window.innerHeight / 45)

		// Variable contenant les résultats de recherche
		if(!results?.length) var results = []

	// Si on a pas la liste de toute les applications fusionnés
	if(!allApplications?.length) allApplications = await localforage.getItem('allApplications')
	if(!allApplications?.length){
		mergeAllSources()
		document.getElementById("appList_div")?.classList.add('hidden')
		loadingSearchButton('remove')
		return showSnackbar('Chargement des sources.. patienter avant de réessayer', 'Actualiser', 'window.location.reload()')
	}

	// Si on recherche "_random"
	if(!results?.length && query == '_random'){
		// Pour chaque application
		for(var i = 0; i < max; i++){
			// Obtenir une application aléatoire
			var randomApp = allApplications[Math.floor(Math.random() * allApplications.length)];

			// Si l'application n'est pas déjà déjà dans la liste
			if(!results.includes({ item: randomApp })) results.push({ item: randomApp });
			else i--;

			// Si la liste est pleine
			if(results.length === max) break;
		}

		// Au cas où y'a trop d'applis, on enlève jusqu'à avoir le nombre maximum voulu
		while(results.length > max) results.pop();
	}

	// Si on recherche "_all"
	if(!results?.length && query == '_all'){
		// Ajouter toute les premières applications à result
		for(var i = 0; i < max; i++){
			// Si l'application n'est pas déjà déjà dans la liste
			if(!results.includes({ item: allApplications[i] })) results.push({ item: allApplications[i] });
			else i--;

			// Si la liste est pleine
			if(results.length == max) break;
		}

		// Au cas où y'a trop d'applis, on enlève jusqu'à avoir le nombre maximum voulu
		while(results.length > max) results.pop();
	}

	// Si on recherche "_noIcons"
	if(!results?.length && query == '_noIcons'){
		// Ajouter toute les applications qui n'ont pas d'icônes
		for(var i = 0; i < allApplications.length; i++){
			// Si l'application n'a pas d'icône
			if(!allApplications[i].icon){
				// Si l'application n'est pas déjà déjà dans la liste
				if(!results.includes({ item: allApplications[i] })) results.push({ item: allApplications[i] });
				else i--;

				// Si la liste est pleine
				if(results.length == max) break;
			}
		}

		// Au cas où y'a trop d'applis, on enlève jusqu'à avoir le nombre maximum voulu
		while(results.length > max) results.pop();
	}

	// Si on recherche "_pwa"
	if(!results?.length && query == '_pwa'){
		// Ajouter toute les applications qui n'ont pas d'icônes
		for(var i = 0; i < allApplications.length; i++){
			// Si l'application est une pwa
			if(allApplications[i].type == 'pwa'){
				// Si l'application n'est pas déjà déjà dans la liste
				if(!results.includes({ item: allApplications[i] })) results.push({ item: allApplications[i] });
				else i--;

				// Si la liste est pleine
				if(results.length == max) break;
			}
		}

		// Au cas où y'a trop d'applis, on enlève jusqu'à avoir le nombre maximum voulu
		while(results.length > max) results.pop();
	}

	// Utiliser Fuse.js pour trouver les résultats
	if(!results?.length) var fuse = new Fuse(allApplications, {
		includeScore: true,
		shouldSort: true,
		useExtendedSearch: true,
		distance: 200,
		threshold: 0.3,
		keys: [
			{
				name: 'name',
				weight: 0.6
			},
			{
				name: 'packageName',
				weight: 0.5
			}
		]
	})

	// Obtenir les résultats avec FuseJS
	if(!results?.length) results = await fuse.search(query);

	// Trier par rapport au score
	results.sort((a, b) => {
		return a.score - b.score;
	});

	// Supprimer les résultats en trop
	results = results.slice(0, max);

	// Enlever tout les squelettes
	Array.from(document.getElementsByClassName('skeleton')).forEach(skeleton => { skeleton.remove() })

	// Si il n'y a aucune application
	if(results.length == 0) return loadingSearchButton('remove') & document.getElementById('appList_div').classList.add('hidden') & showSnackbar('Aucune application trouvée', 'Fermer', '')

	// Enregistrer dans le stockage de session
	if(query != '_random' && query != '_noIcons') sessionStorage.setItem(`search-${query}`, JSON.stringify(results))

	// Pour chaque application
	for(var app of results){
		// Ajouter une carte
		document.getElementById('appList').innerHTML += generateCard(app?.item?.name, app?.item?.packageName || app?.item?.link, app?.item?.icon || 'https://raw.githubusercontent.com/johan-perso/findapp/main/public/icons/APK_defaultIcon.png', app?.item?.links);

		// Selon la taille d'écran
		if(window.innerWidth < 470) document.getElementById(`cardPlatform_${app?.item?.packageName || app?.item?.link}`).innerText = app?.item?.description?.split('\n').join(' ') || 'Aucune description'

		// Ajouter au stockage de la session
		sessionStorage.setItem(app?.item?.packageName || app?.item?.link, JSON.stringify(app.item))
	}

	// Modifier certains éléments par rapport à la taille de l'écran
	if(window.innerWidth < 470) document.getElementById("text_searchResult").innerText = 'Résultats'
	if(window.innerWidth < 350) document.getElementById("text_reportSomething").remove()
	if(window.innerWidth < 325) document.querySelectorAll('[isCardTitle]').forEach(card => card.remove()) & document.querySelectorAll('[isCardButton]').forEach(button => button.style.width = '100%')

	// Rendre la carte visible
	document.getElementById('app-container').innerHTML = null
	document.getElementById('appList_div').classList.remove('hidden');

	// Réactiver le bouton
	loadingSearchButton('remove')
}

// Fonction pour simplifier un string en enlevant certains caractères
function simplifyString(string){
	// Quelques vérifications
	if(!string) return string;
	if(typeof string != 'string') return string;

	// Retourner le string modifié
	return string.replace('https://','').replace('http://','').replace('www.','').replace(/\./g, '').replace(/\//g, '')
}

// Fonction pour obtenir une application par son nom de packet
async function getApp(packageName){
	// Si on a pas la liste de toute les applications fusionnés
	var allApplications = await localforage.getItem('allApplications')
	if(!allApplications){
		mergeAllSources()
		return { error: true, message: "Chargement des sources.. Réessayer plus tard ou actualiser" }
	}

	// Préparer la variable qui contiendra l'application
	var app;

	// Si c'est une PWA
	if(packageName.startsWith('https://') || packageName.startsWith('http://')){
		app = allApplications.find(app => simplifyString(app?.link) == simplifyString(packageName))
	} else {
		// Sinon, on considére que c'est une application native
		app = allApplications.find(app => simplifyString(app?.packageName) == simplifyString(packageName))
	}

	// Vérifier qu'un résultat existe
	if(!app) return { error: true, message: "Aucune application trouvée" }

	// Retourner l'application
	return app
}

// Fonction pour ajouter / retirer un logo de chargement au bouton de recherche
function loadingSearchButton(state){
	if(state === 'add'){
		document.getElementById("searchButton").disabled = true;
		document.getElementById("search_button_loadingIcon").style.display = ''
	}
	if(state === 'remove'){
		document.getElementById("searchButton").disabled = false;
		document.getElementById("search_button_loadingIcon").style.display = 'none'
	}
}

// Fonction pour afficher un snackbar
async function showSnackbar(title, buttonText, buttonAction){
	// Générer un identifiant aléatoire à 9 chiffres
	var id = Math.floor(Math.random() * 100000000);

	// Si un snackbar est déjà présent, l'enlever
	if(document.querySelectorAll('.mdc-snackbar')) document.querySelectorAll('.mdc-snackbar').forEach((dialog) => { dialog.remove() });

	// Ajouter sur la page le snackbar
	document.body.innerHTML += `<aside id="snack_${id}" class="mdc-snackbar"><div class="mdc-snackbar__surface" role="status" aria-relevant="additions"><div class="mdc-snackbar__label" aria-atomic="false">${title.replace(/"/g,'\"')}</div><div class="mdc-snackbar__actions" aria-atomic="true"><button onclick="${buttonAction?.replace(/"/g, '\"')}" type="button" class="mdc-button mdc-snackbar__action"><div class="mdc-button__ripple"></div><span class="mdc-button__label">${buttonText}</span></button></div></div></aside>`

	// Ouvrir le snackbar
	var snack = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
	snack.open();

	// Retourner le snackbar
	return document.getElementById(`snack_${id}`);
}

// Fonction pour ajouter une source à la liste
async function addSource(sourceLink){
	// Ajouter au stockage local
	localStorage.setItem('sources', JSON.stringify([...JSON.parse(localStorage.getItem('sources') || '[]'), sourceLink]))

	// Ajouter dans la source dans la page
	if(document.getElementById('listSourcesTbody')) document.getElementById('listSourcesTbody').insertAdjacentHTML('beforeend', `<tr sourceName="${encodeURIComponent(sourceLink)}" class="mdc-data-table__row"><th width="50%" style="color: #dee2e6;" class="mdc-data-table__cell" scope="row">${escapeHTML(capitalizeFirstLetter((await fetchSource(sourceLink)).name))}</th><td width="50%" style="color: #dee2e6;" class="mdc-data-table__cell sourceLink">${escapeHTML(sourceLink)}</td><td nowrap style="color: #dee2e6;" class="mdc-data-table__cell"><button class="mdc-button mdc-button--raised" onclick="showSourceDetails(this.parentElement.parentElement.querySelector('.sourceLink').innerText)"><span class="mdc-button__ripple"></span>Afficher</button>\n<button class="mdc-button mdc-button--raised" onclick="removeSource(this.parentElement.parentElement.querySelector('.sourceLink').innerText)"><span class="mdc-button__ripple"></span>Supprimer</button></td></tr>`)

	// Si la table était masqué, l'afficher
	if(document?.getElementById('listSources')?.style?.display == 'none') document.getElementById('listSources').style.display = ''

	// Vider l'input
	if(document.getElementById('sourceLink')) document.getElementById('sourceLink').value = ''

	// Retourner la liste complète
	return JSON.parse(localStorage.getItem('sources') || '[]')
}

// Fonction pour supprimer une source de la liste
async function removeSource(sourceLink){
	// Supprimer de la liste
	localStorage.setItem('sources', JSON.stringify(JSON.parse(localStorage.getItem('sources') || '[]').filter(source => source !== sourceLink)))

	// Si la source est présente dans la page, l'enlever
	if(document.querySelector(`[sourceName="${encodeURIComponent(sourceLink)}"]`)) document.querySelector(`[sourceName="${encodeURIComponent(sourceLink)}"]`)?.remove()

	// Si la table est maintenant vide, la masquer
	if(document.getElementById('listSourcesTbody').childElementCount == 0) document.getElementById('listSources').style.display = 'none'

	// Enlever du localforage si elle est présente
	var shortSourceName = `source-${sourceLink.replace('https://','').replace('http://','').replace('www.','').replace(/\./g, '')}`;
	if(await localforage?.getItem(shortSourceName) != null) var cachedsource = await localforage.removeItem(shortSourceName)

	// Retourner la liste complète
	return JSON.parse(localStorage.getItem('sources') || '[]')
}

// Fonction pour fusionner toute les applications de toute les sources
async function mergeAllSources(){
	// Récupérer la liste complète des sources
	var sources = JSON.parse(localStorage.getItem('sources') || '[]')

	// Récupérer la liste complète des applications
	var applications = JSON.parse(localStorage.getItem('applications') || '[]')

	// Parcourir la liste des sources
	for(var i = 0; i < sources.length; i++){
		// Récupérer la liste des applications de la source
		var sourceApplications = await fetchSource(sources[i])

		// Parcourir la liste des applications de la source
		for(var j = 0; j < sourceApplications.apps.length; j++){
			if(!applications.includes(sourceApplications.apps[j])) applications.push(sourceApplications.apps[j])
		}
	}

	// Ajouter la liste complète des applications à la liste des applications
	localforage.setItem('allApplications', applications)

	// Retourner la liste complète des applications
	return applications
}

// Fonction pour fetch une source d'applications, et l'enregistrer dans le stockage local
var cachedSources = [];
async function fetchSource(sourceLink){
	// Obtenir un nom raccourci pour la source
	var shortSourceName = `source-${sourceLink.replace('https://','').replace('http://','').replace('www.','').replace(/\./g, '')}`;

	// Si la source est présente dans la variable cachedSources, on la retourne
	if(cachedSources.find(source => source.sourceLink === sourceLink)) return cachedSources.find(source => source.sourceLink === sourceLink)

	// Si localForage n'est pas présent
	if(!localforage) return { error: true, message: "LocalForage n'est pas présent." } & showSnackbar("LocalForage n'est pas présent", 'Fermer', '');

	// Vérifier si la source n'a pas été mise dans le cache
	if(await localforage?.getItem(shortSourceName) != null) var cachedsource = await localforage.getItem(shortSourceName)

	// Si la source était mise en cache, mais date d'il y a plus de 2 heures
	if(cachedsource && new Date(cachedsource.date) < new Date(new Date().getTime() - 1000 * 60 * 60 * 2)){
		// Supprimer la source du cache
		await localforage.removeItem(shortSourceName)
		cachedsource = null
	} else if(cachedsource) return cachedsource

	// Sinon, fetch l'URL
	var fetchedSource = await fetch(sourceLink).then(res => res.text()).catch(err => {
		// Si c'est une erreur 404
		if(err.status === 404){
			removeSource(sourceLink);
			showSnackbar("Source incorrecte : page non trouvé", 'Fermer', '');
		}

		// Si on est hors connexion
		if(!navigator.onLine){
			loadingSearchButton('remove')
			showSnackbar("Aucune connexion internet", 'Réessayer', 'window.location.reload()');
		} else {
			// Sinon, afficher l'erreur
			console.log(err);
			removeSource(sourceLink);
			showSnackbar("Impossible de récupérer une source", 'Fermer', '');
		}

		// Retourner stopExec
		return "stopExec";
	})

	// Si on doit arrêter l'exécution
	if(fetchedSource === "stopExec") return { error: true, message: "Une erreur est survenue." }

	// Parse en JSON
	try {
		fetchedSource = JSON.parse(fetchedSource);
	} catch(err){
		fetchedSource = { error: true, message: "Une erreur est survenue." }
		removeSource(sourceLink)
		showSnackbar("Source incorrecte : format JSON non valide", 'Fermer', '');
	}

	// Si on a une erreur
	if(fetchedSource.error == true) return fetchedSource

	// Ajouter la source au stockage local (et ajouter la date)
	await localforage.setItem(shortSourceName, { apps: fetchedSource?.apps, name: fetchedSource?.name, date: new Date() })
	
	// Si la source n'est pas présente dans la variable cachedSources, on l'ajoute
	if(!cachedSources.find(source => source.sourceLink === sourceLink)) cachedSources.push({ sourceLink, apps: fetchedSource?.apps, name: fetchedSource?.name, date: new Date() })

	// Retourner le contenu de la source
	return { apps: fetchedSource?.apps, name: fetchedSource?.name, date: new Date() }
}

// Fonction pour vérifier des entrées invalide dans une liste d'application
function checkInvalidEntries(appsList){
	// Supprimer les applications qui n'ont pas de nom
	appsList = appsList.filter(app => (app.type == 'pwa' && (!app.name || !app.link || !app.connectivityType || !app.manifestLink)) || (app.type == 'native' && (!app.name || !app.packageName || !app.links || !app.links.length > 0)))

	// Retourner la liste
	return appsList
}

// Fonction pour afficher les détails d'une source
var manuellyEditedAddedOffset;
async function showSourceDetails(sourceLink, offset=0){
	// Si la source n'est pas présente
	if(!sourceLink) return showSnackbar("Source non présente", 'Fermer', '');

	// Fetch la source
	var source = await fetchSource(sourceLink)

	// Si un modal est déjà sur la page, l'enlever
	if(document.querySelector('.mdc-dialog')) document.querySelector('.mdc-dialog').remove();

	// Si l'offset est supérieure au nombre d'application, le modifier
	if(addedOffset > source.apps.length) addedOffset = source.apps.length

	// Prendre en compte le décalage de la source
	var addedOffset = manuellyEditedAddedOffset || 200;
	source.appsWithOffset = source.apps.slice(offset, offset + addedOffset)

	// Générer un identifiant unique pour chaque bouton de navigation (en rapport avec l'offset pour le rendre complètement unique)
	var firstButtonId = encodeURIComponent(`${sourceLink}-1-${Math.floor(Math.random() * 1000000000)}-${offset}`)
	var secondButtonId = encodeURIComponent(`${sourceLink}-2-${Math.floor(Math.random() * 1000000000)}-${offset}`)

	// Ajouter le modal sur la page
	document.body.innerHTML += `<div class="mdc-dialog"><div class="mdc-dialog__container"><div class="mdc-dialog__surface" role="alertdialog" aria-modal="true"><h2 class="mdc-dialog__title">Source : ${escapeHTML(source.name)}</h2><div class="mdc-dialog__content space-y-2"><div class="flex flex-col items-center"><span class="text-sm">Affichage de <span class="font-semibold text-gray-700">${offset}</span> à <span class="font-semibold text-gray-700">${offset + addedOffset}</span> sur <span class="font-semibold text-gray-700">${source?.apps?.length}</span> applications</span><div class="inline-flex mt-2 xs:mt-0"><button ${offset < 1 ? 'disabled ' : ''}id="${firstButtonId}" class="inline-flex items-center py-2 px-4 text-sm font-medium text-white bg-gray-800 rounded-l hover:bg-gray-900${offset < 1 ? ' cursor-not-allowed' : ''}"><svg class="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd"></path></svg>Précédent</button><button ${(offset+addedOffset-1) > source?.apps?.length ? 'disabled ' : ''}id="${secondButtonId}" class="inline-flex items-center py-2 px-4 text-sm font-medium text-white bg-gray-800 rounded-r border-0 border-l border-gray-700 hover:bg-gray-900${(offset+addedOffset-1) > source?.apps?.length ? ' cursor-not-allowed' : ''}">Suivant<svg class="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></button></div></div><ol start="${offset + 1}" class="list-inside list-decimal">${source?.appsWithOffset?.map((app, index) => `<li><a href="/#app-${app.packageName || app.link || JSON.stringify(app) || app}" class="text-blue-400">${escapeHTML(app.name)}</a></li>`).join('')}</ol></div><div class="mdc-dialog__actions"><button type="button" class="mdc-button mdc-dialog__button"data-mdc-dialog-action="discard"><div class="mdc-button__ripple"></div><span class="mdc-button__label">OK</span></button></div></div></div><div class="mdc-dialog__scrim"></div></div>`

	// Quand on clique sur le bouton précédent
	document.getElementById(firstButtonId).addEventListener('click', async () => {
		showSourceDetails(sourceLink, offset - addedOffset)
	})

	// Quand on clique sur le bouton suivant
	document.getElementById(secondButtonId).addEventListener('click', async () => {
		showSourceDetails(sourceLink, offset + addedOffset)
	})

	// "ouvrir" le modal
	new MDCDialog(document.querySelector('.mdc-dialog')).open();
}
