import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/** Comment — on a Card (FR-4.5). No read-only tier: anyone with board access can post. */
const commentSchema = new Schema(
  {
    cardId: {
      type: Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      index: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type Comment = InferSchemaType<typeof commentSchema>;
export type CommentDoc = HydratedDocument<Comment>;
export const CommentModel = model("Comment", commentSchema);
