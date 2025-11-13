import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerToEvent,
  unregisterFromEvent,
  reportEvent,
  getReports,
  getReportById,
  updateReportStatus,
  getUserEvents,
  approveEvent,
  rejectEvent,
  blockUser,
  unblockUser,
  getAllUsers
} from '../controllers/eventController.js';
import { getEventMessages } from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

// Rotte pubbliche (richiedono autenticazione ma non admin)
router.get('/', protect, getEvents); // Lista eventi (filtrati per ruolo)
router.get('/my-events', protect, getUserEvents); // Dashboard personale

// NOTE: le rotte specifiche (es. /admin/...) devono essere registrate prima delle rotte con parametri generici (/:id)
// altrimenti Express risolve ':id' con 'admin' e le rotte non vengono raggiunte.

// ========== ROTTE SOLO ADMIN (PRIMA DELLE ROTTE CON :id) ==========
router.get('/admin/users', protect, admin, getAllUsers); // Lista utenti
router.get('/admin/reports', protect, admin, getReports); // Lista report
router.get('/admin/reports/:reportId', protect, admin, getReportById); // Dettaglio report
router.put('/admin/reports/:reportId/status', protect, admin, updateReportStatus); // Aggiorna status report
router.put('/:id/approve', protect, admin, approveEvent); // Approva evento
router.put('/:id/reject', protect, admin, rejectEvent); // Rifiuta evento

// ========== ROTTE CON PARAMETRI GENERICI ==========
router.get('/:id/messages', protect, getEventMessages); // History chat evento
router.get('/:id', protect, getEventById); // Dettagli evento

// Rotte per utenti autenticati (user + admin)
router.post('/', protect, upload.single('image'), createEvent); // Crea evento con immagine
router.put('/:id', protect, upload.single('image'), updateEvent); // Modifica evento (solo creator)
router.delete('/:id', protect, deleteEvent); // Elimina evento (creator o admin)
router.post('/:id/register', protect, registerToEvent); // Iscrizione
router.delete('/:id/unregister', protect, unregisterFromEvent); // Cancella iscrizione
router.post('/:id/report', protect, reportEvent); // Segnala evento (tutti possono segnalare)
router.put('/users/:userId/block', protect, admin, blockUser); // Blocca utente
router.put('/users/:userId/unblock', protect, admin, unblockUser); // Sblocca utente

export default router;
