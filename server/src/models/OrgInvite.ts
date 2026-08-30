import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { ORG_ROLES } from "./enums.js";

/**
 * OrgInvite — required by the API contract (`POST /orgs/:orgId/invites`,
 * `POST /orgs/invites/:inviteToken/accept`) but not enumerated in
 * srs/05-data-model.md. Added here so the documented invite flow (UC-2) can be
 * implemented; see PROJECT_RULES.md §9 note on the data-model gap.
 */
const orgInviteSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    // Owner cannot be granted via invite (UC-2: Admin / Member only).
    role: { type: String, enum: ORG_ROLES.filter((r) => r !== "owner"), required: true },
    token: { type: String, required: true, unique: true, index: true },
    invitedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export type OrgInvite = InferSchemaType<typeof orgInviteSchema>;
export type OrgInviteDoc = HydratedDocument<OrgInvite>;
export const OrgInviteModel = model("OrgInvite", orgInviteSchema);
