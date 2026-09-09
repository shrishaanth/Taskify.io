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

export async function deleteOrgCascade(orgId: Types.ObjectId | string) {
  const projects = await ProjectModel.find({ organizationId: orgId })
    .select("_id")
    .lean();
  for (const p of projects) await deleteProjectCascade(p._id);
  await OrgInviteModel.deleteMany({ organizationId: orgId });
  await OrgMembershipModel.deleteMany({ organizationId: orgId });
  await OrganizationModel.deleteOne({ _id: orgId });
}
