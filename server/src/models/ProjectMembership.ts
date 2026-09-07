import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { PROJECT_ROLES } from "./enums.js";

const projectMembershipSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: { type: String, enum: PROJECT_ROLES, required: true },
  },
  { timestamps: true },
);

projectMembershipSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export type ProjectMembership = InferSchemaType<typeof projectMembershipSchema>;
export type ProjectMembershipDoc = HydratedDocument<ProjectMembership>;
export const ProjectMembershipModel = model(
  "ProjectMembership",
  projectMembershipSchema,
);
