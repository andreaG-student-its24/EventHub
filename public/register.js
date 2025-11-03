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
            // Salva il token nel localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            
            messageDiv.textContent = 'Registrazione completata! Reindirizzamento...';
            messageDiv.className = 'message success';
            
            // Reindirizza alla dashboard dopo 1.5 secondi
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
        } else {
            messageDiv.textContent = data.message || 'Errore durante la registrazione';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        messageDiv.textContent = 'Errore di connessione al server';
        messageDiv.className = 'message error';
    }
});
