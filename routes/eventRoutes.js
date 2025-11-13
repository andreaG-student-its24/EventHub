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

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Ottieni lista eventi (user vede solo approved, admin vede tutti)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtra per categoria
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filtra per location
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filtra per status (solo admin)
 *     responses:
 *       200:
 *         description: Lista eventi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', protect, getEvents);

/**
 * @swagger
 * /events/my-events:
 *   get:
 *     summary: Dashboard personale - eventi creati e iscrizioni
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eventi personali
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 createdEvents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 registeredEvents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-events', protect, getUserEvents);

// NOTE: le rotte specifiche (es. /admin/...) devono essere registrate prima delle rotte con parametri generici (/:id)
// altrimenti Express risolve ':id' con 'admin' e le rotte non vengono raggiunte.

// ========== ROTTE SOLO ADMIN (PRIMA DELLE ROTTE CON :id) ==========

/**
 * @swagger
 * /events/admin/users:
 *   get:
 *     summary: Lista tutti gli utenti (solo admin)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista utenti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/admin/users', protect, admin, getAllUsers);

/**
 * @swagger
 * /events/admin/reports:
 *   get:
 *     summary: Lista tutte le segnalazioni (solo admin)
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista segnalazioni
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/admin/reports', protect, admin, getReports);

/**
 * @swagger
 * /events/admin/reports/{reportId}:
 *   get:
 *     summary: Dettaglio segnalazione (solo admin)
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID segnalazione
 *     responses:
 *       200:
 *         description: Dettaglio segnalazione
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/admin/reports/:reportId', protect, admin, getReportById);

/**
 * @swagger
 * /events/admin/reports/{reportId}/status:
 *   put:
 *     summary: Aggiorna status segnalazione (solo admin)
 *     tags: [Admin - Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID segnalazione
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_review, resolved]
 *     responses:
 *       200:
 *         description: Status aggiornato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Status non valido
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/admin/reports/:reportId/status', protect, admin, updateReportStatus);

/**
 * @swagger
 * /events/{id}/approve:
 *   put:
 *     summary: Approva evento (solo admin)
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID evento
 *     responses:
 *       200:
 *         description: Evento approvato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/approve', protect, admin, approveEvent);

/**
 * @swagger
 * /events/{id}/reject:
 *   put:
 *     summary: Rifiuta evento (solo admin)
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID evento
 *     responses:
 *       200:
 *         description: Evento rifiutato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/reject', protect, admin, rejectEvent);

// ========== ROTTE CON PARAMETRI GENERICI ==========

/**
 * @swagger
 * /events/{id}/messages:
 *   get:
 *     summary: Storico messaggi chat evento
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID evento
 *     responses:
 *       200:
 *         description: Storico messaggi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/messages', protect, getEventMessages);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Dettaglio evento
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID evento
 *     responses:
 *       200:
 *         description: Dettaglio evento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', protect, getEventById);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Crea nuovo evento (con immagine opzionale)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - location
 *               - category
 *               - capacity
 *             properties:
 *               title:
 *                 type: string
 *                 example: Workshop JavaScript Avanzato
 *               description:
 *                 type: string
 *                 example: Impara le tecniche avanzate di JavaScript
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-12-31T18:00:00Z
 *               location:
 *                 type: string
 *                 example: Torino
 *               category:
 *                 type: string
 *                 enum: [Conferenza, Workshop, Meetup, Concerto, Sport, Compleanno, Altro]
 *                 example: Workshop
 *               capacity:
 *                 type: integer
 *                 example: 50
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Immagine evento (opzionale)
 *     responses:
 *       201:
 *         description: Evento creato (pending se user, approved se admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Dati mancanti o non validi
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', protect, upload.single('image'), createEvent);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Modifica evento (solo creator o admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID evento
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Evento aggiornato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Non sei il creator dell'evento
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', protect, upload.single('image'), updateEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Elimina evento (creator o admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID evento
 *     responses:
 *       200:
 *         description: Evento eliminato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Evento eliminato con successo
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Non sei il creator dell'evento
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', protect, deleteEvent);

/**
 * @swagger
 * /events/{id}/register:
 *   post:
 *     summary: Iscriviti a un evento
 *     tags: [Participation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID evento
 *     responses:
 *       200:
 *         description: Iscrizione effettuata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Evento al completo o già iscritto
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/register', protect, registerToEvent);

/**
 * @swagger
 * /events/{id}/unregister:
 *   delete:
 *     summary: Cancella iscrizione da evento
 *     tags: [Participation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID evento
 *     responses:
 *       200:
 *         description: Iscrizione cancellata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Non sei iscritto a questo evento
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id/unregister', protect, unregisterFromEvent);

/**
 * @swagger
 * /events/{id}/report:
 *   post:
 *     summary: Segnala un evento (tutti gli utenti possono segnalare)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID evento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [abuse, violence, discrimination, other]
 *                 example: abuse
 *               details:
 *                 type: string
 *                 example: Contenuto offensivo nella descrizione
 *     responses:
 *       201:
 *         description: Segnalazione inviata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Hai già segnalato questo evento
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/report', protect, reportEvent);

/**
 * @swagger
 * /events/users/{userId}/block:
 *   put:
 *     summary: Blocca utente (solo admin)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID utente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Comportamento inappropriato
 *     responses:
 *       200:
 *         description: Utente bloccato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/users/:userId/block', protect, admin, blockUser);

/**
 * @swagger
 * /events/users/{userId}/unblock:
 *   put:
 *     summary: Sblocca utente (solo admin)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID utente
 *     responses:
 *       200:
 *         description: Utente sbloccato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/users/:userId/unblock', protect, admin, unblockUser);

export default router;
