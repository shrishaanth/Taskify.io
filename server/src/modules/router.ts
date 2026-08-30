import { Router } from "express";
import { authRouter } from "./auth/auth.routes.js";
import { boardsRouter } from "./boards/boards.routes.js";
import { cardsRouter } from "./cards/cards.routes.js";
import { attachmentsRouter } from "./cards/attachments.js";
import { commentsRouter } from "./cards/comments.js";
import { subtasksRouter } from "./cards/subtasks.js";
import { notificationsRouter } from "./notifications/notifications.routes.js";
import { orgsRouter } from "./orgs/orgs.routes.js";

/** Everything under `/api/v1` (spec §7 — one versioned surface, no legacy routes). */
export const apiV1Router: Router = Router();

apiV1Router.use("/auth", authRouter);
apiV1Router.use("/orgs", orgsRouter);
apiV1Router.use("/projects/:projectId/boards", boardsRouter);
apiV1Router.use("/boards/:boardId/cards", cardsRouter);
apiV1Router.use("/cards/:cardId/subtasks", subtasksRouter);
apiV1Router.use("/cards/:cardId/comments", commentsRouter);
apiV1Router.use("/cards/:cardId/attachments", attachmentsRouter);
apiV1Router.use("/notifications", notificationsRouter);
