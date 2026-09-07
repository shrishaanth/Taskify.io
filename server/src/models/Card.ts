import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { PRIORITIES } from "./enums.js";

const cardSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    columnId: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    labels: { type: [String], default: [] },
    assigneeIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    dueDate: { type: Date },
    priority: { type: String, enum: PRIORITIES },
  },
  { timestamps: true },
);

cardSchema.index({ boardId: 1, columnId: 1, order: 1 });

export type Card = InferSchemaType<typeof cardSchema>;
export type CardDoc = HydratedDocument<Card>;
export const CardModel = model("Card", cardSchema);
