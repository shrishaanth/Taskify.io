import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CommentDocument extends Document {
  _id: mongoose.Types.ObjectId;
  issueId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  body: string;
  isEdited: boolean;
  isDeleted: boolean;
  parentId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<CommentDocument>(
  {
    issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  },
  { timestamps: true },
);

CommentSchema.virtual('id').get(function (this: CommentDocument) {
  return this._id.toString();
});

CommentSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => {  return ret; } });
CommentSchema.index({ issueId: 1, createdAt: 1 });
CommentSchema.index({ authorId: 1 });

export const CommentModel: Model<CommentDocument> =
  mongoose.models.Comment || mongoose.model<CommentDocument>('Comment', CommentSchema);
