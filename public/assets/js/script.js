document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const keyword = document.getElementById('keyword').value;
    const responseDiv = document.getElementById('response');
    const searchContainer = document.getElementById('searchContainer');
    const resultContainer = document.getElementById('resultContainer');

    if (keyword.trim() === '') {
        responseDiv.innerHTML = '<p class="error">Veuillez entrer un mot-clé.</p>';
        responseDiv.classList.add('show');
        return;
    }

    // Préparer le conteneur de réponse
    responseDiv.innerHTML = '<p>Recherche en cours...</p>';
    responseDiv.classList.remove('show');

    // Appliquer l'effet de décalage
    searchContainer.classList.add('moved');
    resultContainer.classList.add('show');

    try {
        const response = await fetch(`http://localhost:3000/pdf/search?keyword=${encodeURIComponent(keyword)}`);
        const data = await response.json();

        setTimeout(() => {
            if (data.found) {
                const highlightedText = highlightKeyword(data.excerpt, keyword);
                responseDiv.innerHTML = `
                    <p>Page: ${data.pageNumber}</p>
                    <p>${highlightedText}</p>
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

// Fonction pour mettre le mot-clé en gras dans le texte
function highlightKeyword(text, keyword) {
    const regex = new RegExp(`(${keyword})`, 'gi'); // Recherche insensible à la casse
    return text.replace(regex, '<strong>$1</strong>'); // Met le mot-clé en gras
}

// Fonctionnalité du bouton retour
document.getElementById('backButton').addEventListener('click', () => {
    const searchContainer = document.getElementById('searchContainer');
    const resultContainer = document.getElementById('resultContainer');
    const responseDiv = document.getElementById('response');

    // Réinitialiser les effets de translation et masquer le conteneur de résultats
    searchContainer.classList.remove('moved');
    resultContainer.classList.remove('show');
    responseDiv.classList.remove('show');
});
