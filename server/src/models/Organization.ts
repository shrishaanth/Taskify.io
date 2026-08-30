import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/** Organization — the tenant boundary. */
const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: true },
);

export type Organization = InferSchemaType<typeof organizationSchema>;
export type OrganizationDoc = HydratedDocument<Organization>;
export const OrganizationModel = model("Organization", organizationSchema);
