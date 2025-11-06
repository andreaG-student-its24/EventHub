// Importo la libreria Express
import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import Event from './models/Event.js';
import User from './models/User.js';
import Message from './models/Message.js';

// Carico le variabili d'ambiente dal file .env
dotenv.config();

//Esegui la connessione al DataBase
connectDB();

// Creo un'stanza dell'applicazione Express
const app = express();
// Creo HTTP server e inizializzo Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // stesso dominio in produzione; qui per sviluppo
    methods: ['GET', 'POST']
  }
});

//Middleware per leggere JSON nel corpo della richiesta
app.use(express.json()); 

// Serve i file statici dalla cartella public
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Utilizzo delle rotte di autenticazione
// Tutte le rotte definite in authRoutes saranno precedute da '/api/auth'
// Esempio: /api/auth/register, /api/auth/login
app.use('/api/auth', authRoutes); // Collega le rotte all'app

// Utilizzo delle rotte eventi
app.use('/api/events', eventRoutes);

// Rende io disponibile ai controller tramite app.locals
app.locals.io = io;

// Definiamo la porta su cui il server ascolterà
// Usa la porta dal file .env, oppure la 5000 come default
const PORT = process.env.PORT || 5000; // <-- CORREZIONE 3: Uso di process.env

// Avviamo il server e lo mettiamo in ascolto sulla porta definita
// Middleware di autenticazione per Socket.IO
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Token mancante'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { id, role, iat, exp }
    socket.data.userId = decoded.id; // Salva userId in socket.data per filtri successivi
    return next();
  } catch (err) {
    return next(new Error('Token non valido'));
  }
});

// Gestione connessioni Socket.IO
io.on('connection', (socket) => {
  // Un utente richiede di unirsi alla chat di un evento
  socket.on('join_event', async ({ eventId }) => {
    try {
      // Verifica che l'utente sia iscritto all'evento
      const event = await Event.findById(eventId).select('participants');
      if (!event) return socket.emit('error_message', 'Evento non trovato');

      const isParticipant = event.participants.some(p => p.toString() === socket.user.id);
      if (!isParticipant) return socket.emit('error_message', 'Accesso negato: non sei iscritto a questo evento');

      // Unisciti alla stanza dell'evento
      const room = `event:${eventId}`;
      socket.join(room);
      socket.emit('joined_event', { eventId });
    } catch (err) {
      socket.emit('error_message', 'Errore nel join della chat');
    }
  });

  // Ricezione messaggio chat
  socket.on('chat_message', async ({ eventId, text }) => {
    if (!text || !text.trim()) return;
    try {
      const event = await Event.findById(eventId).select('participants');
      if (!event) return socket.emit('error_message', 'Evento non trovato');

      const isParticipant = event.participants.some(p => p.toString() === socket.user.id);
      if (!isParticipant) return socket.emit('error_message', 'Accesso negato: non sei iscritto a questo evento');

      // Persisti il messaggio
      const message = await Message.create({
        event: eventId,
        sender: socket.user.id,
        text: text.trim()
      });

      // Popola dati mittente minimi
      const populated = await message.populate('sender', 'name email');

      // Invia a tutti nella stanza
      io.to(`event:${eventId}`).emit('chat_message', {
        _id: populated._id,
        event: eventId,
        sender: populated.sender,
        text: populated.text,
        createdAt: populated.createdAt
      });
    } catch (err) {
      socket.emit('error_message', 'Errore invio messaggio');
    }
  });
});

server.listen(PORT, () => {
  console.log(` Server in esecuzione sulla porta ${PORT}`);
});