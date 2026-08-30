import { AppError } from "../../lib/errors.js";
import { deleteCardCascade } from "../../lib/cascade.js";
import { notifyCardAssigned } from "../../lib/notify.js";
import {
  AttachmentModel,
  BoardModel,
  CardModel,
  CommentModel,
  ProjectMembershipModel,
  SubtaskModel,
  type CardDoc,
} from "../../models/index.js";

async function loadBoard(boardId: string) {
  const board = await BoardModel.findById(boardId).lean();
  if (!board) throw AppError.notFound();
  return board;
}

function assertColumnExists(
  columns: { id: string }[],
  columnId: string,
): void {
  if (!columns.some((c) => c.id === columnId)) {
    throw AppError.validation(`Column "${columnId}" does not exist on this board`);
  }
}

/** UC-5 — every assignee must have access to the board's project. */
async function assertAssigneesHaveAccess(projectId: string, assigneeIds: string[]) {
  if (assigneeIds.length === 0) return;
  const members = await ProjectMembershipModel.find({
    projectId,
    userId: { $in: assigneeIds },
  })
    .select("userId")
    .lean();
  const allowed = new Set(members.map((m) => String(m.userId)));
  const bad = assigneeIds.filter((id) => !allowed.has(id));
  if (bad.length > 0) {
    throw AppError.validation(
      "Every assignee must be a member of this project",
      { assigneeIds: bad },
    );
  }
}

export async function listCards(boardId: string) {
  return CardModel.find({ boardId }).sort({ columnId: 1, order: 1 }).lean();
}

export async function createCard(input: {
  boardId: string;
  projectId: string;
  actorId: string;
  title: string;
  columnId: string;
  description?: string;
  labels?: string[];
  assigneeIds?: string[];
  dueDate?: string | null;
  priority?: "low" | "medium" | "high" | "urgent";
  order?: number;
}) {
  const board = await loadBoard(input.boardId);
  assertColumnExists(board.columns, input.columnId);
  const assigneeIds = input.assigneeIds ?? [];
  await assertAssigneesHaveAccess(input.projectId, assigneeIds);

  const order =
    input.order ??
    (await CardModel.countDocuments({
      boardId: input.boardId,
      columnId: input.columnId,
    }));

  const card = await CardModel.create({
    organizationId: board.organizationId,
    boardId: input.boardId,
    columnId: input.columnId,
    order,
    title: input.title,
    labels: input.labels ?? [],
    assigneeIds,
    ...(input.description ? { description: input.description } : {}),
    ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
  });

  await notifyCardAssigned(
    assigneeIds,
    { id: card._id.toString(), title: card.title },
    input.actorId,
  );
  return card;
}

async function findCardOnBoard(boardId: string, cardId: string): Promise<CardDoc> {
  const card = await CardModel.findOne({ _id: cardId, boardId });
  if (!card) throw AppError.notFound();
  return card;
}

export async function getCardDetail(boardId: string, cardId: string) {
  const card = await findCardOnBoard(boardId, cardId);
  const [subtasks, comments, attachments] = await Promise.all([
    SubtaskModel.find({ cardId }).sort({ createdAt: 1 }).lean(),
    CommentModel.find({ cardId }).sort({ createdAt: 1 }).lean(),
    AttachmentModel.find({ cardId }).sort({ createdAt: 1 }).lean(),
  ]);
  return { card, subtasks, comments, attachments };
}

export async function updateCard(input: {
  boardId: string;
  cardId: string;
  projectId: string;
  actorId: string;
  patch: {
    title?: string;
    description?: string | null;
    labels?: string[];
    assigneeIds?: string[];
    dueDate?: string | null;
    priority?: "low" | "medium" | "high" | "urgent" | null;
  };
}) {
  const card = await findCardOnBoard(input.boardId, input.cardId);
  const { patch } = input;

  if (patch.assigneeIds !== undefined) {
    await assertAssigneesHaveAccess(input.projectId, patch.assigneeIds);
  }

  if (patch.title !== undefined) card.title = patch.title;
  if (patch.labels !== undefined) card.set("labels", patch.labels);
  if (patch.description !== undefined) {
    if (patch.description === null) card.set("description", undefined);
    else card.description = patch.description;
  }
  if (patch.dueDate !== undefined) {
    if (patch.dueDate === null) card.set("dueDate", undefined);
    else card.dueDate = new Date(patch.dueDate);
  }
  if (patch.priority !== undefined) {
    if (patch.priority === null) card.set("priority", undefined);
    else card.priority = patch.priority;
  }

  let newlyAssigned: string[] = [];
  if (patch.assigneeIds !== undefined) {
    const before = new Set(card.assigneeIds.map(String));
    newlyAssigned = patch.assigneeIds.filter((id) => !before.has(id));
    card.set("assigneeIds", patch.assigneeIds);
  }

  await card.save();

  if (newlyAssigned.length > 0) {
    await notifyCardAssigned(
      newlyAssigned,
      { id: card._id.toString(), title: card.title },
      input.actorId,
    );
  }
  return card;
}

/** UC-6 — move within/between columns, renumbering the affected columns. */
export async function moveCard(input: {
  boardId: string;
  cardId: string;
  columnId: string;
  order: number;
}) {
  const board = await loadBoard(input.boardId);
  assertColumnExists(board.columns, input.columnId);
  const card = await findCardOnBoard(input.boardId, input.cardId);

  const fromColumn = card.columnId;
  const toColumn = input.columnId;

  // Pull the card out of its current column ordering.
  const targetSiblings = (
    await CardModel.find({
      boardId: input.boardId,
      columnId: toColumn,
      _id: { $ne: card._id },
    })
      .sort({ order: 1 })
      .lean()
  ).map((c) => c._id);

  const insertAt = Math.max(0, Math.min(input.order, targetSiblings.length));
  targetSiblings.splice(insertAt, 0, card._id);

  card.columnId = toColumn;
  card.order = insertAt;
  await card.save();

  // Renumber the target column.
  await Promise.all(
    targetSiblings.map((id, i) =>
      CardModel.updateOne({ _id: id }, { $set: { order: i } }),
    ),
  );

  // Renumber the source column (if different) to close the gap.
  if (fromColumn !== toColumn) {
    const sourceSiblings = await CardModel.find({
      boardId: input.boardId,
      columnId: fromColumn,
    })
      .sort({ order: 1 })
      .lean();
    await Promise.all(
      sourceSiblings.map((c, i) =>
        CardModel.updateOne({ _id: c._id }, { $set: { order: i } }),
      ),
    );
  }

  return (await CardModel.findById(card._id))!;
}

export async function deleteCard(boardId: string, cardId: string) {
  await findCardOnBoard(boardId, cardId);
  await deleteCardCascade(cardId);
}
