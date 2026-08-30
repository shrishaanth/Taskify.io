import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { PROJECT_ROLES } from "./enums.js";

/**
 * ProjectMembership — the single source of truth for who can see a Project at
 * all. No row for a (project, user) pair ⇒ that user cannot open the project or
 * see its boards/cards/members (FR-2.3). A Project may have multiple `head`
 * rows. Granting a row requires the user already have an OrgMembership on the
 * owning org — enforced at the application layer.
 */
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
