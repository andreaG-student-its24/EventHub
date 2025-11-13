document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Salva il token nel localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            
            messageDiv.textContent = 'Login effettuato! Reindirizzamento...';
            messageDiv.className = 'message success';
            
            // Reindirizza alla dashboard dopo 1.5 secondi
            setTimeout(() => {
                window.location.href = '/pages/dashboard.html';
            }, 1500);
        } else {
            // Gestione speciale per email non verificata
            if (data.emailNotVerified) {
                messageDiv.innerHTML = `
                    ${data.message}
                    <br><br>
                    <button onclick="resendVerificationEmail('${email}')" 
                            style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                        Reinvia Email di Verifica
                    </button>
                `;
                messageDiv.className = 'message error';
            } else {
                messageDiv.textContent = data.message || 'Credenziali non valide';
                messageDiv.className = 'message error';
            }
        }
    } catch (error) {
        messageDiv.textContent = 'Errore di connessione al server';
        messageDiv.className = 'message error';
    }
});

// Funzione per reinviare email di verifica
async function resendVerificationEmail(email) {
    const messageDiv = document.getElementById('message');
    
    try {
        const response = await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.textContent = data.message;
            messageDiv.className = 'message success';
        } else {
            messageDiv.textContent = data.message;
            messageDiv.className = 'message error';
        }
    } catch (error) {
        messageDiv.textContent = 'Errore durante l\'invio della richiesta';
        messageDiv.className = 'message error';
    }
}
