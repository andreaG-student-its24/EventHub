import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
}, {
  timestamps: true,
});

messageSchema.index({ event: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
