import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/**
 * RefreshToken — server-tracked, rotatable, revocable (spec §5, NFR-1.2).
 * Only the SHA-256 hash of the opaque token is stored. A TTL index on
 * `expiresAt` cleans expired rows automatically.
 */
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

// TTL: Mongo removes the doc once `expiresAt` is in the past.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshToken = InferSchemaType<typeof refreshTokenSchema>;
export type RefreshTokenDoc = HydratedDocument<RefreshToken>;
export const RefreshTokenModel = model("RefreshToken", refreshTokenSchema);
