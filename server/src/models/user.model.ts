import mongoose, { Schema, Document, Model } from 'mongoose';
import type { UserRole } from '@taskify/shared';

export interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl: string;
  tokenVersion: number;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    locale: string;
    emailNotifications: boolean;
  };
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    tokenVersion: { type: Number, default: 0 },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      locale: { type: String, default: 'en-US' },
      emailNotifications: { type: Boolean, default: true },
    },
    lastActiveAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.virtual('id').get(function (this: UserDocument) {
  return this._id.toString();
});

UserSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => {
  
  
  return ret;
}});

UserSchema.set('toObject', { virtuals: true });

UserSchema.index({ email: 1 }, { unique: true });

export const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
