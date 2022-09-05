# FindApp

FindApp vous permet de cherchez des applications (web et native) pour Android.


## Prérequis (self-host)

* [nodejs v14+ et npm](https://nodejs.org) installé.


## Tester

[![Open in Stackblitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/johan-perso/findapp)


## Sources d'applications

> Les explications pour créer une source sont disponibles sur le site de FindApp, mais peuvent être difficile à comprendre. Voici des explications plus complètes.

**Comment ça marche :**

Une source est un fichier JSON permettant d'établir une liste d'applications, natives et/ou web. Les sources sont utilisés pour alimenter les résultats de recherches.

Vous pouvez depuis la page de [gestion des sources](https://findapp.johanstick.me/source) ajouter une source par un lien (peu importe le domaine).

**Créer un fichier de source :**

Vous devez créer un fichier au format JSON contenant un string `name` et un array `apps`.

Votre array `apps` doit contenir des objets avec les propriétés suivantes :

* Pour les PWAs : `name`, `link`, `manifestLink`, `connectivityType` ("worksOffline" ou "onlineOnly"), `description` (facultatif), `icon` (facultatif), `type` défini sur "pwa"
* Pour les applis natives : `name`, `packageName`, `description` (facultatif), `icon` (facultatif), `type` défini sur "native", `links` (array contenant des objets pour chaque plateforme de téléchargement, avec les propriétés `name`, `apkLink`, `platformLink`)


```json
{
	"name": "Le nom de votre source",
	"apps": [
		{
			"name": "Twitter",
			"packageName": "com.twitter.android",
			"icon": "https://image.winudf.com/v2/image1/Y29tLnR3aXR0ZXIuYW5kcm9pZF9pY29uXzE1NTU0NjI4MTJfMDI2/icon.png?w=512&fakeurl=1",
			"description": "Rejoignez la conversation !",
			"type": "native",
			"links": [
				{
					"name": "APKPure",
					"apkLink": "https://apkpure.com/fr/twitter/com.twitter.android/download?from=details",
					"platformLink": "https://apkpure.com/fr/twitter/com.twitter.android"
				}
			]
		},
		{
			"name": "Rickdetect",
			"link": "https://rickdetect.johanstick.me/",
			"icon": "https://rickdetect.johanstick.me/favicon.png",
			"description": "Détecter des rick rolls, juste à partir d'un lien.",
			"manifestLink": "https://rickdetect.johanstick.me/manifest.json",
			"connectivityType": "worksOffline",
			"type": "pwa"
		}
	]
}
```

**Héberger une source :**

Vous pouvez utiliser n'importe quel type d'hébergement, tant qu'il permet de servir des fichiers JSON bruts. Un repo GitHub, ou un Gist peut vous permettre cela.

**Exemple de sources :**

Des exemples de sources complètes peuvent être trouvés dans le dossier [public/sources](https://github.com/johan-perso/findapp/tree/main/public/sources).


## Licence

MIT © [Johan](https://johanstick.me)
