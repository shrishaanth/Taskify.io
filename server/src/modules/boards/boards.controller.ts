import type { Request, Response } from "express";
import { boardDto } from "../../lib/serialize.js";
import { emitBoardChanged } from "../../realtime/emit.js";
import * as service from "./boards.service.js";

export async function list(req: Request, res: Response) {
  const boards = await service.listBoards(req.params.projectId);
  res.json(boards.map((b) => boardDto(b, { cardCount: b.cardCount })));
}

export async function create(req: Request, res: Response) {
  const board = await service.createBoard({
    projectId: req.params.projectId,
    name: req.body.name,
    ...(req.body.columns ? { columns: req.body.columns } : {}),
  });
  res.status(201).json(boardDto(board));
}

export async function get(req: Request, res: Response) {
  const board = await service.getBoard(req.params.projectId, req.params.boardId);
  res.json(boardDto(board));
}

export async function update(req: Request, res: Response) {
  const board = await service.updateBoard(
    req.params.projectId,
    req.params.boardId,
    req.body,
  );
  emitBoardChanged(req.params.boardId, "board:update");
  res.json(boardDto(board));
}

export async function remove(req: Request, res: Response) {
  await service.deleteBoard(req.params.projectId, req.params.boardId);
  emitBoardChanged(req.params.boardId, "board:delete");
  res.status(204).end();
}
