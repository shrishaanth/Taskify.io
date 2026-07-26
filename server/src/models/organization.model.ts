import mongoose, { Schema, Document, Model } from 'mongoose';

export interface OrganizationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string;
  ownerId: mongoose.Types.ObjectId;
  settings: {
    allowedDomains: string[];
    defaultRole: 'owner' | 'admin' | 'member' | 'viewer';
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 50,
    },
    description: { type: String, default: '', maxlength: 500 },
    avatarUrl: { type: String, default: '' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    settings: {
      allowedDomains: { type: [String], default: [] },
      defaultRole: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
    },
  },
  { timestamps: true },
);

OrganizationSchema.virtual('id').get(function (this: OrganizationDocument) {
  return this._id.toString();
});

OrganizationSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => {
  
  return ret;
}});

export const OrganizationModel: Model<OrganizationDocument> =
  mongoose.models.Organization || mongoose.model<OrganizationDocument>('Organization', OrganizationSchema);
