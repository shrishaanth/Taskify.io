import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const projectSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
  },
  { timestamps: true },
);

export type Project = InferSchemaType<typeof projectSchema>;
export type ProjectDoc = HydratedDocument<Project>;
export const ProjectModel = model("Project", projectSchema);
