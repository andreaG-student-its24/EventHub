document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Mostra messaggio di verifica email
            messageDiv.innerHTML = `
                <strong>✅ Registrazione completata!</strong><br><br>
                ${data.message}<br><br>
                <small>📧 Controlla anche la cartella spam/posta indesiderata.</small><br><br>
                <a href="/pages/auth/login.html" style="color: #667eea; text-decoration: underline;">
                    Vai al Login
                </a>
            `;
            messageDiv.className = 'message success';
            
            // Pulisci il form
            document.getElementById('registerForm').reset();
        } else {
            messageDiv.textContent = data.message || 'Errore durante la registrazione';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        messageDiv.textContent = 'Errore di connessione al server';
        messageDiv.className = 'message error';
    }
});
