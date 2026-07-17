import mongoose, { Schema, Document, Model } from 'mongoose';

// The only place a role lives. Two roles, no per-project/per-workspace
// overrides — simple and easy to reason about.
export interface UserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'member';
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<UserDocument>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  avatarUrl: { type: String, default: '' },
}, { timestamps: true });

UserSchema.virtual('id').get(function (this: UserDocument) {
  return this._id.toString();
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

export const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
