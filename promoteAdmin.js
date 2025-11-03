// Script per promuovere un utente a admin
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const promoteToAdmin = async () => {
  try {
    // Connetti al database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connesso al database');

    // Trova l'utente per email
    const email = 'andrea.giovene@edu-its.it';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ Utente non trovato con email:', email);
      process.exit(1);
    }

    // Promuovi a admin
    user.role = 'admin';
    await user.save();

    console.log('✅ Utente promosso ad admin con successo!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Nome: ${user.name}`);
    console.log(`👑 Ruolo: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
};

promoteToAdmin();
