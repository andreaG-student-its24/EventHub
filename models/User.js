import mongoose from "mongoose";

const userSchema = new mongoose.Schema({ //Ogni nuovo documento nella collezione "Users" dovrà rispettare questa forma.
  username: {
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
}, {
  timestamps: true,
});

const User = mongoose.model("User", userSchema);

export default User;