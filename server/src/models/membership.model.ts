import mongoose, { Schema, Document, Model } from 'mongoose';

export interface MembershipDocument extends Document {
  _id: mongoose.Types.ObjectId;
  scopeType: 'organization' | 'workspace' | 'project';
  scopeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  addedBy: mongoose.Types.ObjectId | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<MembershipDocument>(
  {
    scopeType: {
      type: String,
      enum: ['organization', 'workspace', 'project'],
      required: true,
    },
    scopeId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      required: true,
    },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

MembershipSchema.virtual('id').get(function (this: MembershipDocument) {
  return this._id.toString();
});

MembershipSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    
    return ret;
  },
});

// One membership per user per scope
MembershipSchema.index({ scopeType: 1, scopeId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ userId: 1, scopeType: 1 });
MembershipSchema.index({ scopeType: 1, scopeId: 1 });

export const MembershipModel: Model<MembershipDocument> =
  mongoose.models.Membership || mongoose.model<MembershipDocument>('Membership', MembershipSchema);
