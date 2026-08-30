import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/**
 * User — srs/05-data-model.md.
 * No global "role" field: all roles are relational, on the Membership models.
 * A freshly signed-up user has zero OrgMembership documents.
 */
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
  },
  { timestamps: true },
);

// Never leak the password hash through JSON serialisation.
userSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    return ret;
  },
});

export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;
export const UserModel = model("User", userSchema);
