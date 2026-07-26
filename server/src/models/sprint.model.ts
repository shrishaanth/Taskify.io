import mongoose, { Schema, Document, Model } from 'mongoose';

export interface SprintDocument extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  goal: string;
  status: 'planning' | 'active' | 'completed';
  startDate: Date | null;
  endDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<SprintDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    goal: { type: String, default: '' },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed'],
      default: 'planning',
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

SprintSchema.virtual('id').get(function (this: SprintDocument) {
  return this._id.toString();
});

SprintSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => {  return ret; } });
SprintSchema.index({ projectId: 1, status: 1 });
SprintSchema.index({ projectId: 1, startDate: -1 });

export const SprintModel: Model<SprintDocument> =
  mongoose.models.Sprint || mongoose.model<SprintDocument>('Sprint', SprintSchema);
