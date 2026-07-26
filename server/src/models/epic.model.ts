import mongoose, { Schema, Document, Model } from 'mongoose';

export interface EpicDocument extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  summary: string;
  color: string;
  status: string;
  startDate: Date | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const EpicSchema = new Schema<EpicDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    summary: { type: String, default: '', maxlength: 500 },
    color: { type: String, default: '#6366f1' },
    status: { type: String, default: 'open' },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

EpicSchema.virtual('id').get(function (this: EpicDocument) {
  return this._id.toString();
});

EpicSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => {  return ret; } });
EpicSchema.index({ projectId: 1 });

export const EpicModel: Model<EpicDocument> =
  mongoose.models.Epic || mongoose.model<EpicDocument>('Epic', EpicSchema);
