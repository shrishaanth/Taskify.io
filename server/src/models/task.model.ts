import mongoose, { Schema, Document, Model } from 'mongoose';

export interface TaskDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TASK_STATUSES = ['Todo', 'In Progress', 'Done'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

const TaskSchema: Schema = new Schema<TaskDocument>({
  title: { type: String, required: [true, 'Title is required'], trim: true },
  description: { type: String, trim: true, default: '' },
  status: { type: String, enum: TASK_STATUSES, default: 'Todo' },
  priority: { type: String, enum: TASK_PRIORITIES, default: 'Medium' },
  // Who the task is for. Every "list tasks" query is scoped by this field
  // for members, instead of ever returning the whole collection.
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, default: null },
}, { timestamps: true });

TaskSchema.virtual('id').get(function (this: TaskDocument) {
  return this._id.toString();
});
TaskSchema.set('toJSON', { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });

TaskSchema.index({ status: 1 });

export const TaskModel: Model<TaskDocument> =
  mongoose.models.Task || mongoose.model<TaskDocument>('Task', TaskSchema);
