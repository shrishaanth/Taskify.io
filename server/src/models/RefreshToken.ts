import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    deviceInfo: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshToken = InferSchemaType<typeof refreshTokenSchema>;
export type RefreshTokenDoc = HydratedDocument<RefreshToken>;
export const RefreshTokenModel = model("RefreshToken", refreshTokenSchema);
