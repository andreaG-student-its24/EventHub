// Funzione per verificare l'email
async function verifyEmail() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const verificationIcon = document.getElementById('verificationIcon');
  const verificationMessage = document.getElementById('verificationMessage');
  const verificationSubmessage = document.getElementById('verificationSubmessage');
  const actionButtons = document.getElementById('actionButtons');

  if (!token) {
    showError('Token di verifica non trovato nell\'URL');
    return;
  }

  try {
    const response = await fetch(`/api/auth/verify-email/${token}`);
    const data = await response.json();

    if (response.ok) {
      showSuccess(data.message);
    } else {
      showError(data.message);
    }
  } catch (error) {
    console.error('Errore durante la verifica:', error);
    showError('Si è verificato un errore durante la verifica. Riprova più tardi.');
  }
}

function showSuccess(message) {
  const verificationIcon = document.getElementById('verificationIcon');
  const verificationMessage = document.getElementById('verificationMessage');
  const verificationSubmessage = document.getElementById('verificationSubmessage');
  const actionButtons = document.getElementById('actionButtons');

  verificationIcon.textContent = '✅';
  verificationIcon.classList.remove('loading');
  verificationIcon.classList.add('success');

  verificationMessage.textContent = message;
  verificationSubmessage.textContent = 'Ora puoi accedere alla piattaforma con le tue credenziali.';

  actionButtons.style.display = 'flex';
  actionButtons.innerHTML = `
    <a href="/pages/auth/login.html" class="btn-primary">
      Vai al Login
    </a>
    <a href="/index.html" class="btn-secondary">
      Torna alla Home
    </a>
  `;
}

function showError(message) {
  const verificationIcon = document.getElementById('verificationIcon');
  const verificationMessage = document.getElementById('verificationMessage');
  const verificationSubmessage = document.getElementById('verificationSubmessage');
  const actionButtons = document.getElementById('actionButtons');

  verificationIcon.textContent = '❌';
  verificationIcon.classList.remove('loading');
  verificationIcon.classList.add('error');

  verificationMessage.textContent = 'Verifica fallita';
  verificationSubmessage.textContent = message;

  actionButtons.style.display = 'flex';
  actionButtons.innerHTML = `
    <button class="btn-primary" onclick="showResendForm()">
      Reinvia Email di Verifica
    </button>
    <a href="/index.html" class="btn-secondary">
      Torna alla Home
    </a>
  `;
}

function showResendForm() {
  const verificationStatus = document.getElementById('verificationStatus');
  
  verificationStatus.innerHTML = `
    <div class="verification-icon">📧</div>
    <div class="verification-message">Reinvia Email di Verifica</div>
    <div class="verification-submessage">
      Inserisci la tua email per ricevere un nuovo link di verifica.
    </div>
    
    <form id="resendForm" style="max-width: 400px; margin: 0 auto;">
      <div class="form-group">
        <input 
          type="email" 
          id="email" 
          name="email" 
          placeholder="La tua email"
          required
          style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px;"
        >
      </div>
      
      <div class="action-buttons" style="margin-top: 20px;">
        <button type="submit" class="btn-primary">
          Invia Email
        </button>
        <button type="button" class="btn-secondary" onclick="location.reload()">
          Annulla
        </button>
      </div>
    </form>
  `;

  document.getElementById('resendForm').addEventListener('submit', handleResendEmail);
}

async function handleResendEmail(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;

  try {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    const verificationStatus = document.getElementById('verificationStatus');

    if (response.ok) {
      verificationStatus.innerHTML = `
        <div class="verification-icon success">✅</div>
        <div class="verification-message">Email inviata con successo!</div>
        <div class="verification-submessage">
          Controlla la tua casella di posta e clicca sul link di verifica.
        </div>
        <div class="action-buttons" style="margin-top: 20px;">
          <a href="/index.html" class="btn-primary">
            Torna alla Home
          </a>
        </div>
      `;
    } else {
      verificationStatus.innerHTML = `
        <div class="verification-icon error">❌</div>
        <div class="verification-message">Errore</div>
        <div class="verification-submessage">${data.message}</div>
        <div class="action-buttons" style="margin-top: 20px;">
          <button class="btn-primary" onclick="showResendForm()">
            Riprova
          </button>
          <a href="/index.html" class="btn-secondary">
            Torna alla Home
          </a>
        </div>
      `;
    }
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore durante l\'invio della richiesta. Riprova più tardi.');
  }
}

// Avvia la verifica quando la pagina viene caricata
document.addEventListener('DOMContentLoaded', verifyEmail);
