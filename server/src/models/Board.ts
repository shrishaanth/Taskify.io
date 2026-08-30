import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/**
 * Board — belongs to one Project, no access-control role of its own (FR-3.1).
 * Columns are embedded (small, board-scoped, always read/written with the
 * board). `organizationId` denormalized for tenant isolation.
 */
const columnSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
  },
  { _id: false },
);

const boardSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    columns: { type: [columnSchema], default: [] },
  },
  { timestamps: true },
);

export type Board = InferSchemaType<typeof boardSchema>;
export type BoardDoc = HydratedDocument<Board>;
export const BoardModel = model("Board", boardSchema);
