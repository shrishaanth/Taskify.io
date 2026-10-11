import { Types } from "mongoose";
import {
  AttachmentModel,
  BoardModel,
  CardModel,
  CommentModel,
  OrgInviteModel,
  OrgMembershipModel,
  OrganizationModel,
  ProjectMembershipModel,
  ProjectModel,
  SubtaskModel,
} from "../models/index.js";

/** Removes cards and everything hanging off them in four statements, however many there are. */
async function deleteCardsCascade(cardIds: (Types.ObjectId | string)[]) {
  if (cardIds.length === 0) return;
  const filter = { cardId: { $in: cardIds } };
  await Promise.all([
    SubtaskModel.deleteMany(filter),
    CommentModel.deleteMany(filter),
    AttachmentModel.deleteMany(filter),
  ]);
  await CardModel.deleteMany({ _id: { $in: cardIds } });
}

export async function deleteCardCascade(cardId: Types.ObjectId | string) {
  await deleteCardsCascade([cardId]);
}

export async function deleteBoardCascade(boardId: Types.ObjectId | string) {
  const cards = await CardModel.find({ boardId }).select("_id").lean();
  await deleteCardsCascade(cards.map((c) => c._id));
  await BoardModel.deleteOne({ _id: boardId });
}

export async function deleteProjectCascade(projectId: Types.ObjectId | string) {
  const boards = await BoardModel.find({ projectId }).select("_id").lean();
  const boardIds = boards.map((b) => b._id);
  // By id set rather than board by board, card by card: deleting a large
  // project used to cost a handful of round trips for every card in it.
  const cards = await CardModel.find({ boardId: { $in: boardIds } })
    .select("_id")
    .lean();
  await deleteCardsCascade(cards.map((c) => c._id));
  await BoardModel.deleteMany({ _id: { $in: boardIds } });
  await ProjectMembershipModel.deleteMany({ projectId });
  await ProjectModel.deleteOne({ _id: projectId });
}

export async function deleteOrgCascade(orgId: Types.ObjectId | string) {
  const projects = await ProjectModel.find({ organizationId: orgId })
    .select("_id")
    .lean();
  for (const p of projects) await deleteProjectCascade(p._id);
  await OrgInviteModel.deleteMany({ organizationId: orgId });
  await OrgMembershipModel.deleteMany({ organizationId: orgId });
  await OrganizationModel.deleteOne({ _id: orgId });
}
