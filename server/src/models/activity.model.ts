import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ActivityDocument extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  scopeType: string | null;
  scopeId: mongoose.Types.ObjectId | null;
  action: string;
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  targetType: string | null;
  targetId: mongoose.Types.ObjectId | null;
  targetTitle: string | null;
  detail: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<ActivityDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    scopeType: { type: String, default: null },
    scopeId: { type: Schema.Types.ObjectId, default: null },
    action: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, required: true },
    targetType: { type: String, default: null },
    targetId: { type: Schema.Types.ObjectId, default: null },
    targetTitle: { type: String, default: null },
    detail: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ActivitySchema.virtual('id').get(function (this: ActivityDocument) {
  return this._id.toString();
});

ActivitySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    
    return ret;
  },
});

ActivitySchema.index({ organizationId: 1, createdAt: -1 });
ActivitySchema.index({ scopeType: 1, scopeId: 1, createdAt: -1 });
ActivitySchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
ActivitySchema.index({ actorId: 1, createdAt: -1 });

export const ActivityModel: Model<ActivityDocument> =
  mongoose.models.Activity || mongoose.model<ActivityDocument>('Activity', ActivitySchema);
