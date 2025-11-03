document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const messageDiv = document.getElementById('message');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Disabilita il pulsante durante la richiesta
    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio in corso...';
    
    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.textContent = '✅ Email inviata! Controlla la tua casella di posta e segui le istruzioni.';
            messageDiv.className = 'message success';
            
            // Svuota il form
            document.getElementById('email').value = '';
        } else {
            messageDiv.textContent = data.message || 'Errore durante l\'invio dell\'email';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        messageDiv.textContent = 'Errore di connessione al server';
        messageDiv.className = 'message error';
    } finally {
        // Riabilita il pulsante
        submitBtn.disabled = false;
        submitBtn.textContent = 'Invia email di reset';
    }
});
