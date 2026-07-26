import mongoose, { Schema, Document, Model } from 'mongoose';

export interface AttachmentDocument extends Document {
  _id: mongoose.Types.ObjectId;
  issueId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  url: string;
  thumbnailUrl: string | null;
  createdAt: Date;
}

const AttachmentSchema = new Schema<AttachmentDocument>(
  {
    issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    storageKey: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AttachmentSchema.virtual('id').get(function (this: AttachmentDocument) {
  return this._id.toString();
});

AttachmentSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => {  return ret; } });
AttachmentSchema.index({ issueId: 1 });

export const AttachmentModel: Model<AttachmentDocument> =
  mongoose.models.Attachment || mongoose.model<AttachmentDocument>('Attachment', AttachmentSchema);
