import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    enum: ['abuse', 'violence', 'discrimination', 'other'],
    required: true
  },
  details: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved'],
    default: 'open'
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

reportSchema.index({ event: 1, status: 1, createdAt: -1 });

export default mongoose.model('Report', reportSchema);
