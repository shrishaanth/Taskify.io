import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ProjectDocument extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  key: string;
  description: string;
  avatarUrl: string;
  leadId: mongoose.Types.ObjectId | null;
  isArchived: boolean;
  counter: number;
  settings: {
    isPrivate: boolean;
    defaultAssignee: mongoose.Types.ObjectId | null;
    epicEnabled: boolean;
    sprintsEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<ProjectDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z][A-Z0-9]{1,9}$/,
    },
    description: { type: String, default: '', maxlength: 1000 },
    avatarUrl: { type: String, default: '' },
    leadId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isArchived: { type: Boolean, default: false },
    counter: { type: Number, default: 0 },
    settings: {
      isPrivate: { type: Boolean, default: false },
      defaultAssignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      epicEnabled: { type: Boolean, default: true },
      sprintsEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

ProjectSchema.virtual('id').get(function (this: ProjectDocument) {
  return this._id.toString();
});

ProjectSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => {
  
  return ret;
}});

ProjectSchema.index({ workspaceId: 1, key: 1 }, { unique: true });
ProjectSchema.index({ workspaceId: 1, isArchived: 1 });

export const ProjectModel: Model<ProjectDocument> =
  mongoose.models.Project || mongoose.model<ProjectDocument>('Project', ProjectSchema);
