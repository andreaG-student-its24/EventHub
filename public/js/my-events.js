// Verifica autenticazione
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/pages/auth/login.html';
}

// Variabili globali
let currentUser = null;
let socket = null;
let activeChatEventId = null;

// Carica profilo utente
async function loadUserProfile() {
    try {
        const response = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Sessione scaduta');
        }
        
        currentUser = await response.json();
        
        // Aggiorna UI
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('displayName').textContent = currentUser.name;
        document.getElementById('displayEmail').textContent = currentUser.email;
        document.getElementById('displayRole').textContent = currentUser.role === 'admin' ? '👑 Amministratore' : '👤 Utente';
        
        // Mostra link admin se necessario
        if (currentUser.role === 'admin') {
            document.getElementById('adminLink').classList.remove('hidden');
        }
        
        // Carica eventi
        loadMyEvents();
    } catch (error) {
        console.error('Errore caricamento profilo:', error);
        alert('Sessione scaduta. Effettua nuovamente il login.');
        localStorage.removeItem('token');
        window.location.href = '/pages/auth/login.html';
    }
}

// Carica i miei eventi
async function loadMyEvents() {
    try {
        const response = await fetch('/api/events/my-events', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Errore caricamento eventi');
        
        const data = await response.json();
        const { createdEvents, registeredEvents } = data;
        
        // Aggiorna statistiche
        updateStats(createdEvents, registeredEvents);
        
        // Mostra eventi
        displayCreatedEvents(createdEvents);
        displayRegisteredEvents(registeredEvents);
        
    } catch (error) {
        console.error('Errore:', error);
        showError('Impossibile caricare i tuoi eventi');
    }
}

// Aggiorna statistiche
function updateStats(createdEvents, registeredEvents) {
    document.getElementById('createdCount').textContent = createdEvents.length;
    document.getElementById('registeredCount').textContent = registeredEvents.length;
    
    const pendingEvents = createdEvents.filter(e => e.status === 'pending').length;
    const approvedEvents = createdEvents.filter(e => e.status === 'approved').length;
    
    document.getElementById('pendingCount').textContent = pendingEvents;
    document.getElementById('approvedCount').textContent = approvedEvents;
}

// Mostra eventi creati
function displayCreatedEvents(events) {
    const container = document.getElementById('createdEventsContainer');
    
    if (!events || events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📭 Nessun evento creato</h3>
                <p>Non hai ancora creato nessun evento.</p>
                <a href="dashboard.html#create" class="btn btn-primary">➕ Crea il Tuo Primo Evento</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="event-card">
            ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-image">` : ''}
            <div class="event-header">
                <div>
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    <span class="event-category">${event.category}</span>
                </div>
                <span class="event-status status-${event.status}">${getStatusText(event.status)}</span>
            </div>
            <div class="event-description">${escapeHtml(event.description)}</div>
            <div class="event-info">📅 ${formatDate(event.date)}</div>
            <div class="event-info">📍 ${escapeHtml(event.location)}</div>
            <div class="event-info">
                👥 ${event.participants.length}/${event.capacity} partecipanti
                ${event.isFull ? '<span class="badge badge-danger">Completo</span>' : ''}
            </div>
            ${event.participants.length > 0 ? `
                <div class="participants-preview">
                    <strong>Iscritti:</strong> ${event.participants.map(p => escapeHtml(p.name)).join(', ')}
                </div>
            ` : ''}
            <div class="event-actions">
                ${event.status === 'approved' && event.participants.length > 0 ? `
                    <button onclick="openChat('${event._id}', '${escapeHtml(event.title).replace(/'/g, "\\\'")}')" class="btn btn-primary">💬 Chat</button>
                ` : ''}
                <a href="dashboard.html#edit-${event._id}" class="btn btn-secondary">✏️ Modifica</a>
                <button onclick="deleteEvent('${event._id}')" class="btn btn-danger">🗑️ Elimina</button>
            </div>
        </div>
    `).join('');
}

// Mostra eventi a cui sono iscritto
function displayRegisteredEvents(events) {
    const container = document.getElementById('registeredEventsContainer');
    
    if (!events || events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>🎫 Nessuna iscrizione</h3>
                <p>Non sei ancora iscritto a nessun evento.</p>
                <a href="dashboard.html#browse" class="btn btn-primary">🔍 Cerca Eventi</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="event-card">
            ${event.image ? `<img src="${event.image}" alt="${event.title}" class="event-image">` : ''}
            <div class="event-header">
                <div>
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    <span class="event-category">${event.category}</span>
                </div>
            </div>
            <div class="event-description">${escapeHtml(event.description)}</div>
            <div class="event-info">📅 ${formatDate(event.date)}</div>
            <div class="event-info">📍 ${escapeHtml(event.location)}</div>
            <div class="event-info">👤 Organizzatore: ${escapeHtml(event.creator.name)}</div>
            <div class="event-info">
                👥 ${event.participants.length}/${event.capacity} partecipanti
            </div>
            <div class="event-actions">
                <button onclick="openChat('${event._id}', '${escapeHtml(event.title).replace(/'/g, "\\\'")}')" class="btn btn-primary">💬 Chat</button>
                <button onclick="unregisterFromEvent('${event._id}')" class="btn btn-danger">❌ Annulla Iscrizione</button>
            </div>
        </div>
    `).join('');
}

// Utility functions
function getStatusText(status) {
    const statusMap = {
        'pending': '⏳ In attesa',
        'approved': '✅ Approvato',
        'rejected': '❌ Rifiutato'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showError(message) {
    alert('❌ ' + message);
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Aggiorna tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    });
});

// Cancella iscrizione
async function unregisterFromEvent(eventId) {
    if (!confirm('Vuoi annullare l\'iscrizione a questo evento?')) return;
    
    try {
        const response = await fetch(`/api/events/${eventId}/unregister`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Iscrizione cancellata con successo');
            loadMyEvents(); // Ricarica eventi
        } else {
            alert(`❌ ${data.message}`);
        }
    } catch (error) {
        alert('❌ Errore di connessione');
    }
}

// Elimina evento
async function deleteEvent(eventId) {
    if (!confirm('Sei sicuro di voler eliminare questo evento? Questa azione è irreversibile.')) return;
    
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Evento eliminato con successo');
            loadMyEvents(); // Ricarica eventi
        } else {
            alert(`❌ ${data.message}`);
        }
    } catch (error) {
        alert('❌ Errore di connessione');
    }
}

// =====================
// Chat per evento
// =====================

function ensureSocket() {
    if (socket && socket.connected) return;
    
    socket = io({
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
        console.log('Socket connesso:', socket.id);
    });
    
    socket.on('disconnect', (reason) => {
        console.log('Socket disconnesso:', reason);
        if (activeChatEventId) {
            setChatStatus('Connessione persa. Riconnessione...', true);
        }
    });
    
    socket.on('error_message', (msg) => {
        console.error('Socket error:', msg);
        setChatStatus(msg, true);
    });
    
    socket.on('joined_event', ({ eventId }) => {
        console.log('Joined event room:', eventId);
        setChatStatus('Connesso alla chat', false);
        toggleChatInput(true);
    });
    
    socket.on('chat_message', (message) => {
        if (message.event === activeChatEventId) {
            appendChatMessage(message);
        }
    });
}

async function openChat(eventId, eventTitle) {
    ensureSocket();
    activeChatEventId = eventId;
    
    document.getElementById('chatTitle').textContent = `💬 Chat: ${eventTitle}`;
    document.getElementById('chatModal').style.display = 'block';
    document.getElementById('chatMessages').innerHTML = '<p class="text-muted">Caricamento messaggi...</p>';
    setChatStatus('Connessione in corso...', false);
    toggleChatInput(false);
    
    try {
        // Carica storico messaggi
        const resp = await fetch(`/api/events/${eventId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!resp.ok) throw new Error('Errore caricamento chat');
        
        const messages = await resp.json();
        renderChatMessages(messages);
        
        // Join room
        socket.emit('join_event', { eventId });
        
    } catch (err) {
        setChatStatus(err.message || 'Errore caricamento chat', true);
        document.getElementById('chatMessages').innerHTML = `<p style="color: red; text-align: center;">${err.message}</p>`;
    }
}

function renderChatMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!messages || messages.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align: center;">Nessun messaggio. Inizia la conversazione!</p>';
        return;
    }
    container.innerHTML = messages.map(msg => {
        const isMine = msg.sender._id === currentUser._id;
        return `
            <div class="chat-message ${isMine ? 'mine' : ''}">
                <div class="chat-sender">${escapeHtml(msg.sender.name)}</div>
                <div class="chat-text">${escapeHtml(msg.text)}</div>
                <div class="chat-time">${new Date(msg.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

function appendChatMessage(message) {
    const container = document.getElementById('chatMessages');
    const isMine = message.sender._id === currentUser._id;
    
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${isMine ? 'mine' : ''}`;
    msgEl.innerHTML = `
        <div class="chat-sender">${escapeHtml(message.sender.name)}</div>
        <div class="chat-text">${escapeHtml(message.text)}</div>
        <div class="chat-time">${new Date(message.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
}

function setChatStatus(message, isError = false) {
    const el = document.getElementById('chatStatus');
    el.textContent = message;
    el.style.color = isError ? '#e74c3c' : '#27ae60';
    el.style.display = message ? 'block' : 'none';
}

function toggleChatInput(enabled) {
    document.getElementById('chatInput').disabled = !enabled;
    document.getElementById('chatSendBtn').disabled = !enabled;
}

// Form invio messaggio
document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text || !activeChatEventId) return;
    
    socket.emit('chat_message', {
        eventId: activeChatEventId,
        text
    });
    
    input.value = '';
});

// Chiudi chat
document.getElementById('closeChatModal').addEventListener('click', () => {
    document.getElementById('chatModal').style.display = 'none';
    activeChatEventId = null;
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/auth/login.html';
});

// Carica profilo all'avvio
loadUserProfile();
