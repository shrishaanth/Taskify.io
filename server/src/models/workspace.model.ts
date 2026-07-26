import mongoose, { Schema, Document, Model } from 'mongoose';

export interface WorkspaceDocument extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string;
  leadId: mongoose.Types.ObjectId | null;
  visibility: 'open' | 'private';
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<WorkspaceDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 50 },
    description: { type: String, default: '', maxlength: 500 },
    avatarUrl: { type: String, default: '' },
    leadId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    visibility: { type: String, enum: ['open', 'private'], default: 'open' },
  },
  { timestamps: true },
);

WorkspaceSchema.virtual('id').get(function (this: WorkspaceDocument) {
  return this._id.toString();
});

WorkspaceSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => {
  
  return ret;
}});

WorkspaceSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
WorkspaceSchema.index({ organizationId: 1 });

export const WorkspaceModel: Model<WorkspaceDocument> =
  mongoose.models.Workspace || mongoose.model<WorkspaceDocument>('Workspace', WorkspaceSchema);
