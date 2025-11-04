import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerToEvent,
  unregisterFromEvent,
  getUserEvents,
  approveEvent,
  rejectEvent,
  blockUser,
  unblockUser,
  getAllUsers
} from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Rotte pubbliche (richiedono autenticazione ma non admin)
router.get('/', protect, getEvents); // Lista eventi (filtrati per ruolo)
router.get('/my-events', protect, getUserEvents); // Dashboard personale
router.get('/:id', protect, getEventById); // Dettagli evento

// Rotte per utenti autenticati (user + admin)
router.post('/', protect, createEvent); // Crea evento
router.put('/:id', protect, updateEvent); // Modifica evento (solo creator)
router.delete('/:id', protect, deleteEvent); // Elimina evento (creator o admin)
router.post('/:id/register', protect, registerToEvent); // Iscrizione
router.delete('/:id/unregister', protect, unregisterFromEvent); // Cancella iscrizione

// Rotte solo ADMIN
router.put('/:id/approve', protect, admin, approveEvent); // Approva evento
router.put('/:id/reject', protect, admin, rejectEvent); // Rifiuta evento
router.put('/users/:userId/block', protect, admin, blockUser); // Blocca utente
router.put('/users/:userId/unblock', protect, admin, unblockUser); // Sblocca utente
router.get('/admin/users', protect, admin, getAllUsers); // Lista utenti

export default router;
