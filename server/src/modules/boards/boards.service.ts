import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { AppError } from "../../lib/errors.js";
import { deleteBoardCascade } from "../../lib/cascade.js";
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

/** The project's org id, or a 404 if the project doesn't exist. */
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
  patch: { name?: string; columns?: ColumnInput[] },
) {
  const board = await findBoardInProject(projectId, boardId);
  if (patch.name !== undefined) board.name = patch.name;
  if (patch.columns !== undefined) {
    board.set("columns", normaliseColumns(patch.columns));
  }
  await board.save();
  return board;
}

export async function deleteBoard(projectId: string, boardId: string) {
  await findBoardInProject(projectId, boardId);
  await deleteBoardCascade(boardId);
}
