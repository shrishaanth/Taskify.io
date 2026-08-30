import { Types } from "mongoose";
import {
  AttachmentModel,
  BoardModel,
  CardModel,
  CommentModel,
  ProjectMembershipModel,
  ProjectModel,
  SubtaskModel,
} from "../models/index.js";

/**
 * Explicit, tested cascade deletes (API contract — "not relied on implicitly
 * via Mongo `ref` behaviour"). Each level composes the one below it.
 * No soft-delete / trash in this scope.
 */

export async function deleteCardCascade(cardId: Types.ObjectId | string) {
  await Promise.all([
    SubtaskModel.deleteMany({ cardId }),
    CommentModel.deleteMany({ cardId }),
    AttachmentModel.deleteMany({ cardId }),
  ]);
  await CardModel.deleteOne({ _id: cardId });
}

export async function deleteBoardCascade(boardId: Types.ObjectId | string) {
  const cards = await CardModel.find({ boardId }).select("_id").lean();
  for (const c of cards) await deleteCardCascade(c._id);
  await BoardModel.deleteOne({ _id: boardId });
}

export async function deleteProjectCascade(projectId: Types.ObjectId | string) {
  const boards = await BoardModel.find({ projectId }).select("_id").lean();
  for (const b of boards) await deleteBoardCascade(b._id);
  await ProjectMembershipModel.deleteMany({ projectId });
  await ProjectModel.deleteOne({ _id: projectId });
}
