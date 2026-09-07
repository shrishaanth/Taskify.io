import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const attachmentSchema = new Schema(
  {
    cardId: {
      type: Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      index: true,
    },
    uploadedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { timestamps: true },
);

export type Attachment = InferSchemaType<typeof attachmentSchema>;
export type AttachmentDoc = HydratedDocument<Attachment>;
export const AttachmentModel = model("Attachment", attachmentSchema);
