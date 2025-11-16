import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Serializzazione utente per la sessione
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializzazione utente dalla sessione
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Strategia Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Cerca se l'utente esiste già con questo Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Utente già registrato con Google
          return done(null, user);
        }

        // Controlla se esiste un utente con la stessa email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Utente esiste ma non ha collegato Google, lo colleghiamo ora
          user.googleId = profile.id;
          user.avatar = profile.photos[0]?.value;
          user.isEmailVerified = true; // Email verificata da Google
          await user.save();
          return done(null, user);
        }

        // Crea un nuovo utente
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value,
          isEmailVerified: true, // Email verificata da Google
          role: 'user',
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;
