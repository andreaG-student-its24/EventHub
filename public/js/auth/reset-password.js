// Estrai il token dall'URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    // Se non c'è il token nell'URL, mostra errore
    document.getElementById('message').textContent = 'Token mancante. Richiedi un nuovo link di reset.';
    document.getElementById('message').className = 'message error';
    document.getElementById('resetPasswordForm').style.display = 'none';
}

document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('message');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Verifica che le password coincidano
    if (password !== confirmPassword) {
        messageDiv.textContent = 'Le password non coincidono';
        messageDiv.className = 'message error';
        return;
    }
    
    // Disabilita il pulsante durante la richiesta
    submitBtn.disabled = true;
    submitBtn.textContent = 'Aggiornamento in corso...';
    
    try {
        const response = await fetch(`/api/auth/reset-password/${token}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.textContent = '✅ Password aggiornata con successo! Reindirizzamento al login...';
            messageDiv.className = 'message success';
            
            // Salva il nuovo token (opzionale, per login automatico)
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
            }
            
            // Reindirizza al login dopo 2 secondi
            setTimeout(() => {
                window.location.href = '/pages/auth/login.html';
            }, 2000);
        } else {
            messageDiv.textContent = data.message || 'Errore durante l\'aggiornamento della password';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        messageDiv.textContent = 'Errore di connessione al server';
        messageDiv.className = 'message error';
    } finally {
        // Riabilita il pulsante
        submitBtn.disabled = false;
        submitBtn.textContent = 'Aggiorna Password';
    }
});
