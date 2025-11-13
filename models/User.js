import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({ //Ogni nuovo documento nella collezione "Users" dovrà rispettare questa forma.
  name: {
    type: String,
    required: true, // Mongoose si assicurerà che nessuno possa creare un utente senza fornire questi campi.
  },
  email: {
    type: String,
    required: true, 
    unique: true, //Impedisce di avere due utenti con la stessa email o lo stesso username nel database.
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpire: {
    type: Date,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockedReason: {
    type: String,
  },
}, {
  timestamps: true,
});

// Pre-save hook per hashare la password prima di salvarla
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;