import mongoose, { Schema, Document, Model } from 'mongoose';

export interface RefreshTokenDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  deviceInfo: string;
  ipAddress: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt: Date | null;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    deviceInfo: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup

export const RefreshTokenModel: Model<RefreshTokenDocument> =
  mongoose.models.RefreshToken || mongoose.model<RefreshTokenDocument>('RefreshToken', RefreshTokenSchema);
