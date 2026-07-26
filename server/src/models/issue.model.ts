import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IssueDocument extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  key: string;
  issueNumber: number;
  parentId: mongoose.Types.ObjectId | null;
  epicId: mongoose.Types.ObjectId | null;
  type: 'task' | 'bug' | 'story' | 'epic' | 'subtask';
  title: string;
  description: string;
  status: string;
  priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  reporterId: mongoose.Types.ObjectId;
  assigneeId: mongoose.Types.ObjectId | null;
  labels: string[];
  sprintId: mongoose.Types.ObjectId | null;
  boardColumnId: string | null;
  storyPoints: number | null;
  dueDate: Date | null;
  startDate: Date | null;
  completedAt: Date | null;
  resolution: string | null;
  sortOrder: number;
  watcherIds: mongoose.Types.ObjectId[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IssueDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    key: { type: String, required: true },
    issueNumber: { type: Number, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Issue', default: null },
    epicId: { type: Schema.Types.ObjectId, ref: 'Epic', default: null },
    type: {
      type: String,
      enum: ['task', 'bug', 'story', 'epic', 'subtask'],
      default: 'task',
    },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: '' },
    status: { type: String, required: true, default: 'Todo' },
    priority: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    labels: { type: [String], default: [] },
    sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint', default: null },
    boardColumnId: { type: String, default: null },
    storyPoints: { type: Number, default: null, min: 0, max: 999 },
    dueDate: { type: Date, default: null },
    startDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    resolution: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
    watcherIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

IssueSchema.virtual('id').get(function (this: IssueDocument) {
  return this._id.toString();
});

IssueSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    
    return ret;
  },
});

// ── Indexes for common query patterns ─────────────────────────
IssueSchema.index({ projectId: 1, issueNumber: -1 });
IssueSchema.index({ projectId: 1, status: 1 });
IssueSchema.index({ projectId: 1, sprintId: 1, sortOrder: 1 });
IssueSchema.index({ assigneeId: 1, status: 1 });
IssueSchema.index({ epicId: 1 });
IssueSchema.index({ parentId: 1 });
IssueSchema.index({ key: 1 }, { unique: true });
IssueSchema.index({ projectId: 1, labels: 1 });
IssueSchema.index({ reporterId: 1 });
IssueSchema.index({ dueDate: 1, status: 1 });
IssueSchema.index({ title: 'text', key: 'text' });

export const IssueModel: Model<IssueDocument> =
  mongoose.models.Issue || mongoose.model<IssueDocument>('Issue', IssueSchema);
