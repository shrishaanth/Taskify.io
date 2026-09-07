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
