import mongoose, { Schema, Document, Model } from 'mongoose';

export interface BoardColumn {
  _id: string;
  name: string;
  statusFilter: string[];
  wipLimit: number | null;
  color: string | null;
}

export interface BoardDocument extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  type: 'kanban' | 'scrum';
  columns: BoardColumn[];
  isDefault: boolean;
  filterQuery: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const BoardColumnSchema = new Schema(
  {
    name: { type: String, required: true },
    statusFilter: [{ type: String }],
    wipLimit: { type: Number, default: null },
    color: { type: String, default: null },
  },
  { _id: true },
);

const BoardSchema = new Schema<BoardDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['kanban', 'scrum'], default: 'kanban' },
    columns: { type: [BoardColumnSchema], default: () => defaultColumns() },
    isDefault: { type: Boolean, default: false },
    filterQuery: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

function defaultColumns(): BoardColumn[] {
  return [
    { name: 'To Do', statusFilter: ['Todo'], wipLimit: null, color: '#3b82f6' },
    { name: 'In Progress', statusFilter: ['In Progress'], wipLimit: 5, color: '#eab308' },
    { name: 'Done', statusFilter: ['Done'], wipLimit: null, color: '#22c55e' },
  ] as BoardColumn[];
}

BoardSchema.virtual('id').get(function (this: BoardDocument) {
  return this._id.toString();
});

BoardSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => {  return ret; } });
BoardSchema.index({ projectId: 1 });

export const BoardModel: Model<BoardDocument> =
  mongoose.models.Board || mongoose.model<BoardDocument>('Board', BoardSchema);
