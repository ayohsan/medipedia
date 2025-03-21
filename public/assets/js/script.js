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
    responseDiv.innerHTML = 'Recherche en cours...';
    responseDiv.classList.remove('show');

    // Appliquer l'effet de décalage
    searchContainer.classList.add('moved');
    resultContainer.classList.add('show');

    try {
        const response = await fetch(`/pdf/search?keyword=${encodeURIComponent(keyword)}`);
        const data = await response.json();

        setTimeout(() => {
            if (data.found) {
                let html = `
                    <div class="result-section">
                        <h2>Résumé pour "${keyword}"</h2>
                        <div class="summary">${data.summary || 'Aucun résumé disponible'}</div>
                        
                        <h3>Contextes trouvés (${data.totalOccurrences} occurrences)</h3>
                        <div class="contexts">
                            ${data.contexts?.map(context => `
                                <div class="context">
                                    <p>...${context.before} <strong>${context.keyword}</strong> ${context.after}...</p>
                                </div>
                            `).join('') || 'Aucun contexte disponible'}
                        </div>
                    </div>
                `;
                responseDiv.innerHTML = html;
            } else {
                responseDiv.innerHTML = `<div class="error">${data.message || 'Aucun résultat trouvé'}</div>`;
            }
            responseDiv.classList.add('show');
        }, 500);
    } catch (error) {
        console.error('Erreur:', error);
        responseDiv.innerHTML = '<div class="error">Erreur lors de la recherche</div>';
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
