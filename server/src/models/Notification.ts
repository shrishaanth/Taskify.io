import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { NOTIFICATION_TYPES } from "./enums.js";

/**
 * Notification — in-app alert for a user (FR-6.1).
 * `payload` is a small denormalized snapshot (card title, etc.).
 * Index (userId, createdAt) serves the notification-list query.
 */
const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema>;
export type NotificationDoc = HydratedDocument<Notification>;
export const NotificationModel = model("Notification", notificationSchema);
