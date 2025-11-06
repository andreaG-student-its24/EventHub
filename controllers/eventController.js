import Event from '../models/Event.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';

// Crea un nuovo evento (solo utenti autenticati)
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, category, capacity } = req.body;

    // Verifica che l'utente non sia bloccato
    if (req.user.isBlocked) {
      return res.status(403).json({ 
        message: 'Il tuo account è stato bloccato. Non puoi creare eventi.',
        reason: req.user.blockedReason 
      });
    }

    // Gestione dell'immagine caricata
    const imagePath = req.file ? `/uploads/events/${req.file.filename}` : '';

    const event = await Event.create({
      title,
      description,
      date,
      location,
      category,
      capacity,
      image: imagePath,
      creator: req.user._id,
      status: 'pending', // Tutti gli eventi iniziano come pending
    });

    await event.populate('creator', 'name email');

    res.status(201).json(event);
  } catch (error) {
    // Se c'è un errore, elimina l'immagine caricata
    if (req.file) {
      const filePath = path.join('./public/uploads/events', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Ottieni tutti gli eventi (pubblico)
export const getEvents = async (req, res) => {
  try {
    const { category, date, location, status } = req.query;
    
    const filter = {};
    
    // Solo gli admin possono vedere eventi pending/rejected
    if (req.user && req.user.role === 'admin') {
      if (status) filter.status = status;
    } else {
      filter.status = 'approved'; // Utenti normali vedono solo eventi approvati
    }
    
    if (category) filter.category = category;
    if (location) filter.location = new RegExp(location, 'i');
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const events = await Event.find(filter)
      .populate('creator', 'name email')
      .populate('participants', 'name email')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Ottieni un singolo evento per ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name email role')
      .populate('participants', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    // Se l'evento non è approvato, solo il creator e gli admin possono vederlo
    if (event.status !== 'approved') {
      if (!req.user || (req.user._id.toString() !== event.creator._id.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Non hai i permessi per visualizzare questo evento' });
      }
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Aggiorna un evento (solo creator)
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    // Solo il creator può modificare l'evento
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non sei autorizzato a modificare questo evento' });
    }

    const { title, description, date, location, category, capacity } = req.body;

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location || event.location;
    event.category = category || event.category;
    event.capacity = capacity || event.capacity;
    
    // Se è stata caricata una nuova immagine
    if (req.file) {
      // Elimina la vecchia immagine se esiste
      if (event.image) {
        const oldImagePath = path.join('./public', event.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Salva il nuovo path
      event.image = `/uploads/events/${req.file.filename}`;
    }
    
    // Se l'evento viene modificato, torna in pending
    event.status = 'pending';

    await event.save();
    await event.populate('creator', 'name email');

    res.json(event);
  } catch (error) {
    // Se c'è un errore, elimina la nuova immagine caricata
    if (req.file) {
      const filePath = path.join('./public/uploads/events', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Elimina un evento (solo creator o admin)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    // Solo il creator o un admin può eliminare
    if (event.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non sei autorizzato a eliminare questo evento' });
    }

    // Elimina l'immagine associata se esiste
    if (event.image) {
      const imagePath = path.join('./public', event.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await event.deleteOne();

    res.json({ message: 'Evento eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Iscrizione a un evento
export const registerToEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    // Verifica che l'utente non sia bloccato
    if (req.user.isBlocked) {
      return res.status(403).json({ 
        message: 'Il tuo account è stato bloccato. Non puoi iscriverti agli eventi.',
        reason: req.user.blockedReason 
      });
    }

    // L'evento deve essere approvato
    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Questo evento non è ancora stato approvato' });
    }

    // Verifica che l'evento non sia pieno
    if (event.isFull) {
      return res.status(400).json({ message: 'Evento al completo' });
    }

    // Verifica che l'utente non sia già iscritto
    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Sei già iscritto a questo evento' });
    }

    event.participants.push(req.user._id);
    await event.save();
    await event.populate('creator', 'name email');
    await event.populate('participants', 'name email');

    res.json({ message: 'Iscrizione completata', event });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Cancella iscrizione da un evento
export const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    // Verifica che l'utente sia iscritto
    if (!event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Non sei iscritto a questo evento' });
    }

    event.participants = event.participants.filter(
      (participant) => participant.toString() !== req.user._id.toString()
    );

    await event.save();
    await event.populate('creator', 'name email');
    await event.populate('participants', 'name email');

    res.json({ message: 'Iscrizione cancellata', event });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Dashboard utente - i miei eventi e iscrizioni
export const getUserEvents = async (req, res) => {
  try {
    // Eventi creati dall'utente
    const createdEvents = await Event.find({ creator: req.user._id })
      .populate('participants', 'name email')
      .sort({ date: -1 });

    // Eventi a cui l'utente è iscritto
    const registeredEvents = await Event.find({ 
      participants: req.user._id,
      status: 'approved' 
    })
      .populate('creator', 'name email')
      .sort({ date: 1 });

    res.json({
      createdEvents,
      registeredEvents
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// FUNZIONI ADMIN

// Approva un evento (solo admin)
export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    event.status = 'approved';
    await event.save();
    await event.populate('creator', 'name email');

    res.json({ message: 'Evento approvato', event });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Rifiuta un evento (solo admin)
export const rejectEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento non trovato' });
    }

    event.status = 'rejected';
    await event.save();
    await event.populate('creator', 'name email');

    res.json({ message: 'Evento rifiutato', event });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Blocca un utente (solo admin)
export const blockUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Non puoi bloccare un amministratore' });
    }

    user.isBlocked = true;
    user.blockedReason = reason || 'Violazione dei termini di servizio';
    await user.save();

    res.json({ message: 'Utente bloccato', user: { name: user.name, email: user.email, isBlocked: user.isBlocked } });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Sblocca un utente (solo admin)
export const unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    user.isBlocked = false;
    user.blockedReason = undefined;
    await user.save();

    res.json({ message: 'Utente sbloccato', user: { name: user.name, email: user.email, isBlocked: user.isBlocked } });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};

// Lista tutti gli utenti (solo admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpire');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server', error: error.message });
  }
};
