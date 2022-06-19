// Quand la page a fini de charger
document.addEventListener('DOMContentLoaded', () => {
	// Fonction pour vérifier si le site est installé en tant que PWA
	function isInstalled(){
		// Pour iOS
		if(window.navigator.standalone) return true

		// Pour Android (et potentiellement d'autres systèmes PC)
		if(window.matchMedia('(display-mode: standalone)').matches) return true

		// Si c'est aucun des deux, moi j'pense que la question est vite répondue
		return false
	}

	// Modifier les balise a
	if(isInstalled()){
		// Si c'est installé, on remplace tout les liens a par des liens avec une attr href
		var links = document.querySelectorAll('a')
		for(var i = 0; i < links.length; i++){
			links[i].setAttribute('target', '_blank')
		}
	}
})