import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventHub API',
      version: '1.0.0',
      description: 'API REST per la gestione di eventi e partecipanti. Piattaforma completa con autenticazione JWT, chat in tempo reale, segnalazioni e pannello admin.',
      contact: {
        name: 'EventHub Team',
        email: 'support@eventhub.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://eventhub.example.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Inserisci il token JWT ricevuto dal login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID utente'
            },
            name: {
              type: 'string',
              description: 'Nome completo'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email utente'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'Ruolo utente'
            },
            isBlocked: {
              type: 'boolean',
              description: 'Utente bloccato'
            },
            blockedReason: {
              type: 'string',
              description: 'Motivo blocco'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Event: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID evento'
            },
            title: {
              type: 'string',
              description: 'Titolo evento'
            },
            description: {
              type: 'string',
              description: 'Descrizione evento'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Data e ora evento'
            },
            location: {
              type: 'string',
              description: 'Luogo evento'
            },
            category: {
              type: 'string',
              enum: ['Conferenza', 'Workshop', 'Meetup', 'Concerto', 'Sport', 'Compleanno', 'Altro'],
              description: 'Categoria evento'
            },
            capacity: {
              type: 'integer',
              description: 'Capienza massima'
            },
            image: {
              type: 'string',
              description: 'URL immagine evento'
            },
            creator: {
              $ref: '#/components/schemas/User'
            },
            participants: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/User'
              }
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              description: 'Status approvazione evento'
            },
            isFull: {
              type: 'boolean',
              description: 'Evento al completo'
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            event: {
              type: 'string',
              description: 'ID evento'
            },
            sender: {
              $ref: '#/components/schemas/User'
            },
            text: {
              type: 'string',
              description: 'Testo messaggio'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Report: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            event: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                title: { type: 'string' }
              }
            },
            reporter: {
              $ref: '#/components/schemas/User'
            },
            reason: {
              type: 'string',
              enum: ['abuse', 'violence', 'discrimination', 'other'],
              description: 'Motivo segnalazione'
            },
            details: {
              type: 'string',
              description: 'Dettagli segnalazione'
            },
            status: {
              type: 'string',
              enum: ['open', 'in_review', 'resolved'],
              description: 'Status segnalazione'
            },
            handledBy: {
              type: 'string',
              description: 'ID admin che gestisce'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Messaggio di errore'
            },
            error: {
              type: 'string',
              description: 'Dettagli errore'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token mancante o non valido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Non autorizzato, token non valido'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Permessi insufficienti',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Accesso negato. Solo admin.'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Risorsa non trovata',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Risorsa non trovata'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Autenticazione e gestione utenti'
      },
      {
        name: 'Events',
        description: 'Gestione eventi'
      },
      {
        name: 'Participation',
        description: 'Iscrizioni e partecipazioni'
      },
      {
        name: 'Chat',
        description: 'Messaggi e chat eventi'
      },
      {
        name: 'Reports',
        description: 'Segnalazioni eventi'
      },
      {
        name: 'Admin - Events',
        description: 'Gestione admin eventi'
      },
      {
        name: 'Admin - Users',
        description: 'Gestione admin utenti'
      },
      {
        name: 'Admin - Reports',
        description: 'Gestione admin segnalazioni'
      }
    ]
  },
  apis: ['./routes/*.js'] // Path ai file con le annotations JSDoc
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
