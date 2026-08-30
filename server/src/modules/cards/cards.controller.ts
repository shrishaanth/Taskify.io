import type { Request, Response } from "express";
import { auth } from "../../lib/http.js";
import {
  attachmentDto,
  cardDto,
  commentDto,
  subtaskDto,
} from "../../lib/serialize.js";
import * as service from "./cards.service.js";

function projectId(req: Request): string {
  return req.project?.id ?? req.params.projectId;
}

export async function list(req: Request, res: Response) {
  const cards = await service.listCards(req.params.boardId);
  res.json(cards.map(cardDto));
}

export async function create(req: Request, res: Response) {
  const card = await service.createCard({
    boardId: req.params.boardId,
    projectId: projectId(req),
    actorId: auth(req).userId,
    ...req.body,
  });
  res.status(201).json(cardDto(card));
}

export async function detail(req: Request, res: Response) {
  const { card, subtasks, comments, attachments } = await service.getCardDetail(
    req.params.boardId,
    req.params.cardId,
  );
  res.json({
    ...cardDto(card),
    subtasks: subtasks.map(subtaskDto),
    comments: comments.map(commentDto),
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
  res.json(cardDto(card));
}

export async function move(req: Request, res: Response) {
  const card = await service.moveCard({
    boardId: req.params.boardId,
    cardId: req.params.cardId,
    columnId: req.body.columnId,
    order: req.body.order,
  });
  res.json(cardDto(card));
}

export async function remove(req: Request, res: Response) {
  await service.deleteCard(req.params.boardId, req.params.cardId);
  res.status(204).end();
}
