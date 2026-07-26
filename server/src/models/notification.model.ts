import mongoose, { Schema, Document, Model } from 'mongoose';

export interface NotificationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

NotificationSchema.virtual('id').get(function (this: NotificationDocument) {
  return this._id.toString();
});

NotificationSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => {  return ret; } });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel: Model<NotificationDocument> =
  mongoose.models.Notification || mongoose.model<NotificationDocument>('Notification', NotificationSchema);
