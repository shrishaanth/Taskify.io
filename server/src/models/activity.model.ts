import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Append-only audit trail of who did what. Powers the dashboard activity
 * feed and gives admins accountability ("who reassigned this task?").
 * Capped by a TTL index — entries expire after 30 days so the collection
 * can't grow without bound.
 */
export interface ActivityDocument extends Document {
  _id: mongoose.Types.ObjectId;
  action:
    | 'task.created' | 'task.updated' | 'task.status' | 'task.deleted'
    | 'user.created' | 'user.updated' | 'user.deleted';
  actor: mongoose.Types.ObjectId;
  actorName: string; // denormalized so the feed survives user deletion
  task: mongoose.Types.ObjectId | null;
  taskTitle: string | null; // denormalized so the feed survives task deletion
  // The user this entry concerns (task assignee / managed user). Members
  // only ever see entries where targetUser === their own id.
  targetUser: mongoose.Types.ObjectId | null;
  detail: string;
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema<ActivityDocument>({
  action: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  taskTitle: { type: String, default: null },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  detail: { type: String, default: '' },
}, { timestamps: { createdAt: true, updatedAt: false } });

ActivitySchema.index({ createdAt: -1 });
// Auto-expire after 30 days.
ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

ActivitySchema.virtual('id').get(function (this: ActivityDocument) {
  return this._id.toString();
});
ActivitySchema.set('toJSON', { virtuals: true });

export const ActivityModel: Model<ActivityDocument> =
  mongoose.models.Activity || mongoose.model<ActivityDocument>('Activity', ActivitySchema);
