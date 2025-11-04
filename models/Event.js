import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Il titolo è obbligatorio'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'La descrizione è obbligatoria'],
  },
  date: {
    type: Date,
    required: [true, 'La data è obbligatoria'],
  },
  location: {
    type: String,
    required: [true, 'Il luogo è obbligatorio'],
  },
  category: {
    type: String,
    enum: ['Conferenza', 'Workshop', 'Meetup', 'Concerto', 'Sport', 'Compleanno', 'Altro'],
    default: 'Altro',
  },
  capacity: {
    type: Number,
    required: [true, 'La capienza è obbligatoria'],
    min: [1, 'La capienza deve essere almeno 1'],
  },
  image: {
    type: String,
    default: '',
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Virtual per calcolare i posti disponibili
eventSchema.virtual('availableSpots').get(function() {
  return this.capacity - this.participants.length;
});

// Virtual per verificare se l'evento è pieno
eventSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.capacity;
});

// Assicurati che i virtuals siano inclusi nel JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model("Event", eventSchema);

export default Event;
