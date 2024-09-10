document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const keyword = document.getElementById('keyword').value;
    const responseDiv = document.getElementById('response');
    
    // Vérification si le champ de saisie est vide
    if (keyword.trim() === '') {
        responseDiv.innerHTML = '<p class="error">Veuillez entrer un mot-clé.</p>';
        responseDiv.classList.add('show');
        return;
    }

    // Affichage du message de recherche
    responseDiv.innerHTML = '<p>Recherche en cours...</p>';
    responseDiv.classList.remove('show');
    
    try {
        // Requête API pour rechercher le mot-clé dans le PDF
        const response = await fetch(`http://localhost:3000/pdf/search?keyword=${encodeURIComponent(keyword)}`);
        const data = await response.json();
        
        // Affichage des résultats après une courte pause pour l'effet visuel
        setTimeout(() => {
            if (data.found) {
                responseDiv.innerHTML = `
                    <p class="success">Mot-clé trouvé: <strong>${keyword}</strong></p>
                    <p><strong>Extrait:</strong></p>
                    <p>${data.excerpt}</p>
                `;
            } else {
                responseDiv.innerHTML = `<p class="error">Mot-clé non trouvé: <strong>${keyword}</strong></p>`;
            }
            responseDiv.classList.add('show');
        }, 500);
    } catch (error) {
        responseDiv.innerHTML = '<p class="error">Une erreur est survenue.</p>';
        responseDiv.classList.add('show');
    }
});
