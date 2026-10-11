import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { AppError } from "../../lib/errors.js";
import { deleteBoardCascade, deleteCardCascade } from "../../lib/cascade.js";
import { BoardModel, CardModel, ProjectModel } from "../../models/index.js";

const colId = () => `col_${randomBytes(5).toString("hex")}`;

const DEFAULT_COLUMNS = () => [
  { id: colId(), name: "To Do", order: 0 },
  { id: colId(), name: "In Progress", order: 1 },
  { id: colId(), name: "Done", order: 2 },
];

interface ColumnInput {
  id?: string;
  name: string;
  order: number;
}

function normaliseColumns(input: ColumnInput[]) {
  const seen = new Set<string>();
  return input
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((c, i) => {
      let id = c.id && !seen.has(c.id) ? c.id : colId();
      while (seen.has(id)) id = colId();
      seen.add(id);
      return { id, name: c.name, order: i };
    });
}

async function projectOrgId(projectId: string) {
  const project = await ProjectModel.findById(projectId).select("organizationId").lean();
  if (!project) throw AppError.notFound();
  return String(project.organizationId);
}

export async function listBoards(projectId: string) {
  const boards = await BoardModel.find({ projectId }).sort({ createdAt: 1 }).lean();
  if (boards.length === 0) return [];

  const counts = await CardModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { boardId: { $in: boards.map((b) => new Types.ObjectId(String(b._id))) } } },
    { $group: { _id: "$boardId", count: { $sum: 1 } } },
  ]);
  const countByBoard = new Map(counts.map((c) => [String(c._id), c.count]));

  return boards.map((b) => ({
    ...b,
    cardCount: countByBoard.get(String(b._id)) ?? 0,
  }));
}

export async function createBoard(input: {
  projectId: string;
  name: string;
  columns?: ColumnInput[];
}) {
  const organizationId = await projectOrgId(input.projectId);
  return BoardModel.create({
    organizationId,
    projectId: input.projectId,
    name: input.name,
    columns: input.columns?.length
      ? normaliseColumns(input.columns)
      : DEFAULT_COLUMNS(),
  });
}

async function findBoardInProject(projectId: string, boardId: string) {
  const board = await BoardModel.findOne({ _id: boardId, projectId });
  if (!board) throw AppError.notFound();
  return board;
}

export async function getBoard(projectId: string, boardId: string) {
  return findBoardInProject(projectId, boardId);
}

export async function updateBoard(
  projectId: string,
  boardId: string,
  patch: {
    name?: string;
    columns?: ColumnInput[];
    moveCardsTo?: string;
    deleteCards?: boolean;
  },
) {
  const board = await findBoardInProject(projectId, boardId);
  let cardsChanged = false;

  if (patch.name !== undefined) board.name = patch.name;
  if (patch.columns !== undefined) {
    const next = normaliseColumns(patch.columns);
    const kept = new Set(next.map((c) => c.id));
    const removed = board.columns.map((c) => c.id).filter((id) => !kept.has(id));
    cardsChanged = await rehomeCards(boardId, removed, kept, patch);
    board.set("columns", next);
  }
  await board.save();
  return { board, cardsChanged };
}

/**
 * Cards point at a column by id, so dropping a column that still holds cards
 * would leave them in the database but on no board anyone can see. The caller
 * has to say where they go; returns whether any card was touched.
 */
async function rehomeCards(
  boardId: string,
  removed: string[],
  kept: Set<string>,
  patch: { moveCardsTo?: string; deleteCards?: boolean },
): Promise<boolean> {
  if (removed.length === 0) return false;
  const stranded = await CardModel.find({ boardId, columnId: { $in: removed } })
    .sort({ columnId: 1, order: 1 })
    .select("_id")
    .lean();
  if (stranded.length === 0) return false;

  if (patch.deleteCards) {
    for (const c of stranded) await deleteCardCascade(c._id);
    return true;
  }

  const target = patch.moveCardsTo;
  if (target) {
    if (!kept.has(target)) {
      throw AppError.validation("moveCardsTo must be a column that remains on the board");
    }
    const last = await CardModel.findOne({ boardId, columnId: target })
      .sort({ order: -1 })
      .select("order")
      .lean();
    const start = last ? last.order + 1 : 0;
    await CardModel.bulkWrite(
      stranded.map((c, i) => ({
        updateOne: {
          filter: { _id: c._id },
          update: { $set: { columnId: target, order: start + i } },
        },
      })),
    );
    return true;
  }

  throw AppError.conflict(
    stranded.length === 1
      ? "1 card is still in that column. Move it or delete it first."
      : `${stranded.length} cards are still in that column. Move them or delete them first.`,
    { code: "COLUMN_NOT_EMPTY", cards: stranded.length },
  );
}

export async function deleteBoard(projectId: string, boardId: string) {
  await findBoardInProject(projectId, boardId);
  await deleteBoardCascade(boardId);
}
