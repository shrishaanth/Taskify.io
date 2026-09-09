import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

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
    /**
     * Set when the account is deleted. The document is kept so cards and
     * comments the person authored keep a resolvable author, but every
     * identifying field is scrubbed and the real email is released for reuse.
     */
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    return ret;
  },
});

export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;
export const UserModel = model("User", userSchema);

export const DELETED_USER_NAME = "Deleted user";

/** Matches only accounts that have not been deleted. */
export const activeUser = { deletedAt: null } as const;
