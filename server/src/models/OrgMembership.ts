import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { ORG_ROLES } from "./enums.js";

/**
 * OrgMembership — the single source of truth for "who belongs to which org,
 * at what role" (srs/05-data-model.md). Every org-scoped authorization check
 * reads this collection. Compound-unique on (organizationId, userId).
 */
const orgMembershipSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: { type: String, enum: ORG_ROLES, required: true },
  },
  { timestamps: true },
);

orgMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export type OrgMembership = InferSchemaType<typeof orgMembershipSchema>;
export type OrgMembershipDoc = HydratedDocument<OrgMembership>;
export const OrgMembershipModel = model("OrgMembership", orgMembershipSchema);
