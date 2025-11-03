// Verifica se l'utente è loggato
const token = localStorage.getItem('token');

if (!token) {
    // Se non c'è il token, reindirizza al login
    window.location.href = '/login.html';
}

// Carica i dati dell'utente
async function loadUserProfile() {
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            
            // Aggiorna l'interfaccia con i dati utente
            document.getElementById('userName').textContent = user.name;
            document.getElementById('displayName').textContent = user.name;
            document.getElementById('displayEmail').textContent = user.email;
            document.getElementById('displayRole').textContent = user.role === 'admin' ? 'Amministratore' : 'Utente';
            
            // Mostra link admin se l'utente è admin
            if (user.role === 'admin') {
                document.getElementById('adminLink').style.display = 'inline-block';
            }
            
            // Formatta la data
            const date = new Date(user.createdAt);
            document.getElementById('displayDate').textContent = date.toLocaleDateString('it-IT');
        } else {
            // Token non valido, reindirizza al login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Errore nel caricamento del profilo:', error);
        window.location.href = '/login.html';
    }
}

// Gestione logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Errore durante il logout:', error);
    }
    
    // Rimuovi il token e reindirizza al login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
});

// Carica il profilo all'avvio
loadUserProfile();
