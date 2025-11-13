// Verifica se l'utente è admin
const token = localStorage.getItem('token');
let user = null;
let currentUserId = null;

// Verifica admin status via API (più affidabile di localStorage)
(async () => {
    if (!token) {
        window.location.href = '/pages/auth/login.html';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            user = await response.json();
            if (user.role !== 'admin') {
                alert('Accesso negato. Solo gli amministratori possono accedere a questa pagina.');
                window.location.href = '/pages/dashboard.html';
                return;
            }
            // Admin verificato, carica dati
            loadStats();
            loadUsers();
        } else {
            window.location.href = '/pages/auth/login.html';
        }
    } catch (error) {
        console.error('Errore verifica admin:', error);
        window.location.href = '/pages/auth/login.html';
    }
})();

// Gestione tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Aggiorna tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        // Carica dati
        if (tab === 'users') loadUsers();
        if (tab === 'events') loadEvents();
        if (tab === 'reports') loadReports();
    });
});

// -----------------------
// Report management
// -----------------------

async function loadReports() {
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Caricamento...</td></tr>';
    try {
        const resp = await fetch('/api/events/admin/reports', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!resp.ok) throw new Error('Errore caricamento segnalazioni');
        const reports = await resp.json();
        if (!reports || reports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><h3>Nessuna segnalazione</h3></td></tr>';
            return;
        }

        tbody.innerHTML = reports.map(r => `
            <tr>
                <td>${new Date(r.createdAt).toLocaleString('it-IT')}</td>
                <td>${r.event?.title || '—'}</td>
                <td>${r.reporter?.name || '—'}</td>
                <td>${r.reason}</td>
                <td>${(r.details && r.details.length > 60) ? r.details.slice(0,60) + '...' : (r.details || '')}</td>
                <td><span class="badge badge-${r.status}">${r.status}</span></td>
                <td>
                    <button class="action-btn btn-view" onclick="viewReport('${r._id}')">Visualizza</button>
                    <button class="action-btn btn-approve" onclick="updateReportStatus('${r._id}','in_review')">In Revisione</button>
                    <button class="action-btn btn-reject" onclick="updateReportStatus('${r._id}','resolved')">Risolto</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="color: red; text-align: center;">Errore: ${err.message}</td></tr>`;
    }
}

async function viewReport(reportId) {
    try {
        const resp = await fetch(`/api/events/admin/reports/${reportId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!resp.ok) throw new Error('Impossibile caricare il report');
        const r = await resp.json();
        document.getElementById('rEventTitle').textContent = r.event?.title || '';
        document.getElementById('rReporter').textContent = r.reporter?.name + ' (' + (r.reporter?.email||'') + ')';
        document.getElementById('rReason').textContent = r.reason;
        document.getElementById('rDetails').textContent = r.details || '';
        document.getElementById('rStatus').textContent = r.status;
        // store current report id on modal
        document.getElementById('reportDetailModal').dataset.currentReport = r._id;
        document.getElementById('reportDetailModal').classList.add('active');
    } catch (err) {
        alert(err.message || 'Errore caricamento report');
    }
}

document.getElementById('closeReportDetail').addEventListener('click', () => {
    document.getElementById('reportDetailModal').classList.remove('active');
});

document.getElementById('markInReview').addEventListener('click', async () => {
    const modal = document.getElementById('reportDetailModal');
    const id = modal.dataset.currentReport;
    if (!id) return;
    await updateReportStatus(id, 'in_review');
    modal.classList.remove('active');
});

document.getElementById('markResolved').addEventListener('click', async () => {
    const modal = document.getElementById('reportDetailModal');
    const id = modal.dataset.currentReport;
    if (!id) return;
    await updateReportStatus(id, 'resolved');
    modal.classList.remove('active');
});

async function updateReportStatus(reportId, status) {
    try {
        const resp = await fetch(`/api/events/admin/reports/${reportId}/status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, handledBy: user._id })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.message || 'Errore aggiornamento');
        showToast('Stato segnalazione aggiornato', 3000);
        loadReports();
    } catch (err) {
        alert(err.message || 'Errore');
    }
}

// Carica statistiche
async function loadStats() {
    try {
        // Carica utenti
        const usersResponse = await fetch('/api/events/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await usersResponse.json();
        
        // Carica eventi
        const eventsResponse = await fetch('/api/events?status=pending', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pendingEvents = await eventsResponse.json();
        
        const approvedResponse = await fetch('/api/events?status=approved', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const approvedEvents = await approvedResponse.json();
        
        // Aggiorna statistiche
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('blockedUsers').textContent = users.filter(u => u.isBlocked).length;
        document.getElementById('pendingEvents').textContent = pendingEvents.length;
        document.getElementById('approvedEvents').textContent = approvedEvents.length;
    } catch (error) {
        console.error('Errore caricamento statistiche:', error);
    }
}

// Carica lista utenti
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Caricamento...</td></tr>';
    
    try {
        const response = await fetch('/api/events/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Errore nel caricamento degli utenti');
        
        const users = await response.json();
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><h3>Nessun utente trovato</h3></td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(u => `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.role}">${u.role === 'admin' ? '👑 Admin' : '👤 User'}</span></td>
                <td>
                    ${u.isBlocked 
                        ? `<span class="badge badge-blocked">🚫 Bloccato</span><br><small style="color: #999;">${u.blockedReason || ''}</small>` 
                        : '<span class="badge badge-active">✅ Attivo</span>'
                    }
                </td>
                <td>${new Date(u.createdAt).toLocaleDateString('it-IT')}</td>
                <td>
                    ${u.role !== 'admin' ? (
                        u.isBlocked 
                            ? `<button class="action-btn btn-unblock" onclick="unblockUser('${u._id}')">Sblocca</button>`
                            : `<button class="action-btn btn-block" onclick="openBlockModal('${u._id}', '${u.name}')">Blocca</button>`
                    ) : '<span style="color: #999;">-</span>'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Errore: ${error.message}</td></tr>`;
    }
}

// Carica lista eventi
async function loadEvents() {
    const tbody = document.getElementById('eventsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Caricamento...</td></tr>';
    
    try {
        // Carica tutti gli eventi (pending, approved, rejected)
        const responses = await Promise.all([
            fetch('/api/events?status=pending', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/events?status=approved', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/events?status=rejected', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const [pending, approved, rejected] = await Promise.all(responses.map(r => r.json()));
        const events = [...pending, ...approved, ...rejected].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><h3>Nessun evento trovato</h3></td></tr>';
            return;
        }
        
        tbody.innerHTML = events.map(e => `
            <tr>
                <td>
                    <strong>${e.title}</strong>
                    ${e.image ? `<br><img src="${e.image}" alt="${e.title}" style="max-width: 100px; max-height: 60px; margin-top: 5px; border-radius: 5px; object-fit: cover;">` : ''}
                </td>
                <td>${e.creator.name}</td>
                <td>${new Date(e.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>${e.category}</td>
                <td><span class="badge badge-${e.status}">${getStatusText(e.status)}</span></td>
                <td>
                    ${e.status === 'pending' ? `
                        <button class="action-btn btn-approve" onclick="approveEvent('${e._id}')">Approva</button>
                        <button class="action-btn btn-reject" onclick="rejectEvent('${e._id}')">Rifiuta</button>
                    ` : '<span style="color: #999;">-</span>'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Errore: ${error.message}</td></tr>`;
    }
}

function getStatusText(status) {
    const statusMap = {
        'pending': '⏳ In attesa',
        'approved': '✅ Approvato',
        'rejected': '❌ Rifiutato'
    };
    return statusMap[status] || status;
}

// Apri modal blocco utente
function openBlockModal(userId, userName) {
    currentUserId = userId;
    document.getElementById('blockReason').value = '';
    document.getElementById('blockModal').classList.add('active');
}

// Chiudi modal
document.getElementById('cancelBlock').addEventListener('click', () => {
    document.getElementById('blockModal').classList.remove('active');
    currentUserId = null;
});

// Conferma blocco
document.getElementById('confirmBlock').addEventListener('click', async () => {
    const reason = document.getElementById('blockReason').value.trim();
    
    if (!reason) {
        alert('Inserisci un motivo per il blocco');
        return;
    }
    
    await blockUser(currentUserId, reason);
    document.getElementById('blockModal').classList.remove('active');
    currentUserId = null;
});

// Blocca utente
async function blockUser(userId, reason) {
    try {
        const response = await fetch(`/api/events/users/${userId}/block`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Utente bloccato con successo');
            loadUsers();
            loadStats();
        } else {
            alert(`❌ Errore: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Errore di connessione');
    }
}

// Sblocca utente
async function unblockUser(userId) {
    if (!confirm('Sei sicuro di voler sbloccare questo utente?')) return;
    
    try {
        const response = await fetch(`/api/events/users/${userId}/unblock`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Utente sbloccato con successo');
            loadUsers();
            loadStats();
        } else {
            alert(`❌ Errore: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Errore di connessione');
    }
}

// Approva evento
async function approveEvent(eventId) {
    if (!confirm('Sei sicuro di voler approvare questo evento?')) return;
    
    try {
        const response = await fetch(`/api/events/${eventId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Evento approvato');
            loadEvents();
            loadStats();
        } else {
            alert(`❌ Errore: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Errore di connessione');
    }
}

// Rifiuta evento
async function rejectEvent(eventId) {
    if (!confirm('Sei sicuro di voler rifiutare questo evento?')) return;
    
    try {
        const response = await fetch(`/api/events/${eventId}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('❌ Evento rifiutato');
            loadEvents();
            loadStats();
        } else {
            alert(`❌ Errore: ${data.message}`);
        }
    } catch (error) {
        alert('❌ Errore di connessione');
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/auth/login.html';
});

// Inizializza
loadStats();
loadUsers();
