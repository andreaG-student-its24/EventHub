// Importo la libreria Express
const express = require('express');

// 2. Creo un'stanza dell'applicazione Express
const app = express();

app.use(express.json()); 

// 3. Definiamo la porta su cui il server ascolterà
// Usiamo la porta 3000 come esempio
const PORT = 3000;

// Importa e usa le rotte di autenticazione
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes); // Tutte le rotte in authRoutes inizieranno con /api/auth

// Rotta di prova
//(http://localhost:3000/),
// il server risponderà con un messaggio di benvenuto.
app.get('/', (req, res) => {
  res.send('Benvenuto su EventHub API!');
});

// 5. Avviamo il server e lo mettiamo in ascolto sulla porta definita
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});