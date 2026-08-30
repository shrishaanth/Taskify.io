import type { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { AppError } from "../lib/errors.js";
import { BoardModel, CardModel } from "../models/index.js";

/**
 * For routes nested under `/boards/:boardId/...`: load the board, hide it as a
 * 404 if it belongs to another tenant, and expose its project id downstream
 * (`req.resolvedProjectId`) so `requireProjectRole` can run. Requires
 * `requireAuth` first.
 *
 * Note: we deliberately do NOT write to `req.params` — Express restores
 * `req.params` per router layer under `mergeParams`, dropping injected keys.
 */
export const resolveProjectFromBoard: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.auth) throw AppError.unauthenticated();
    const boardId = req.params.boardId;
    if (!isValidObjectId(boardId)) throw AppError.notFound();

    const board = await BoardModel.findById(boardId)
      .select("organizationId projectId")
      .lean();
    if (!board || !req.auth.orgIds.includes(String(board.organizationId))) {
      throw AppError.notFound();
    }

    req.resolvedProjectId = String(board.projectId);
    req.resolvedBoardId = String(board._id);
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * For routes nested under `/cards/:cardId/...`: load card → board, same 404
 * hiding, expose both project and board ids downstream.
 */
export const resolveProjectFromCard: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.auth) throw AppError.unauthenticated();
    const cardId = req.params.cardId;
    if (!isValidObjectId(cardId)) throw AppError.notFound();

    const card = await CardModel.findById(cardId)
      .select("organizationId boardId")
      .lean();
    if (!card || !req.auth.orgIds.includes(String(card.organizationId))) {
      throw AppError.notFound();
    }

    const board = await BoardModel.findById(card.boardId)
      .select("projectId")
      .lean();
    if (!board) throw AppError.notFound();

    req.resolvedProjectId = String(board.projectId);
    req.resolvedBoardId = String(card.boardId);
    next();
  } catch (err) {
    next(err);
  }
};
