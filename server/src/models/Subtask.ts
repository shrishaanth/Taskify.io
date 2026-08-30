import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/** Subtask — lightweight checklist item on a Card (FR-4.4). */
const subtaskSchema = new Schema(
  {
    cardId: {
      type: Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User" },
    done: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type Subtask = InferSchemaType<typeof subtaskSchema>;
export type SubtaskDoc = HydratedDocument<Subtask>;
export const SubtaskModel = model("Subtask", subtaskSchema);
