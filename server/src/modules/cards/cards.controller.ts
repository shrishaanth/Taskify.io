import type { Request, Response } from "express";
import { auth } from "../../lib/http.js";
import {
  attachmentDto,
  commentDto,
  subtaskDto,
  userDto,
} from "../../lib/serialize.js";
import { UserModel } from "../../models/index.js";
import { emitBoardChanged } from "../../realtime/emit.js";
import * as service from "./cards.service.js";

function projectId(req: Request): string {
  return req.project?.id ?? req.params.projectId;
}

export async function list(req: Request, res: Response) {
  const cards = await service.listCards(req.params.boardId);
  res.json(await service.serializeCards(cards));
}

export async function create(req: Request, res: Response) {
  const card = await service.createCard({
    boardId: req.params.boardId,
    projectId: projectId(req),
    actorId: auth(req).userId,
    ...req.body,
  });
  emitBoardChanged(req.params.boardId, "card:create");
  res.status(201).json(await service.serializeCard(card.toObject()));
}

export async function detail(req: Request, res: Response) {
  const { card, subtasks, comments, attachments } = await service.getCardDetail(
    req.params.boardId,
    req.params.cardId,
  );
  const serialized = await service.serializeCard(card.toObject());
  const authors = await UserModel.find({
    _id: { $in: [...new Set(comments.map((c) => String(c.authorId)))] },
  }).lean();
  const authorById = new Map(authors.map((u) => [String(u._id), u]));
  res.json({
    ...serialized,
    subtasks: subtasks.map(subtaskDto),
    comments: comments.map((c) => {
      const a = authorById.get(String(c.authorId));
      return commentDto(c, a ? userDto(a) : undefined);
    }),
    attachments: attachments.map(attachmentDto),
  });
}

export async function update(req: Request, res: Response) {
  const card = await service.updateCard({
    boardId: req.params.boardId,
    cardId: req.params.cardId,
    projectId: projectId(req),
    actorId: auth(req).userId,
    patch: req.body,
  });
  emitBoardChanged(req.params.boardId, "card:update");
  res.json(await service.serializeCard(card.toObject()));
}

export async function move(req: Request, res: Response) {
  const card = await service.moveCard({
    boardId: req.params.boardId,
    cardId: req.params.cardId,
    columnId: req.body.columnId,
    order: req.body.order,
  });
  emitBoardChanged(req.params.boardId, "card:move");
  res.json(await service.serializeCard(card.toObject()));
}

export async function remove(req: Request, res: Response) {
  await service.deleteCard(req.params.boardId, req.params.cardId);
  emitBoardChanged(req.params.boardId, "card:delete");
  res.status(204).end();
}
