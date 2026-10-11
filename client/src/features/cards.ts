import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as cardsApi from "../api/cards";
import type {
  CardDetail,
  CardPatch,
  CardSummary,
  Id,
  UserRef,
} from "../types/domain";
import { qk } from "./queryClient";

export function applyCardMove(
  cards: CardSummary[],
  cardId: Id,
  toColumnId: string,
  order: number,
): CardSummary[] {
  const moving = cards.find((c) => c.id === cardId);
  if (!moving) return cards;
  const fromColumnId = moving.columnId;
  const rest = cards.filter((c) => c.id !== cardId);

  const target = rest
    .filter((c) => c.columnId === toColumnId)
    .sort((a, b) => a.order - b.order);
  const at = Math.max(0, Math.min(order, target.length));
  target.splice(at, 0, { ...moving, columnId: toColumnId });
  const renumberedTarget = target.map((c, i) => ({
    ...c,
    columnId: toColumnId,
    order: i,
  }));

  const renumberedSource =
    fromColumnId === toColumnId
      ? []
      : rest
          .filter((c) => c.columnId === fromColumnId)
          .sort((a, b) => a.order - b.order)
          .map((c, i) => ({ ...c, order: i }));

  const untouched = rest.filter(
    (c) => c.columnId !== toColumnId && c.columnId !== fromColumnId,
  );
  return [...untouched, ...renumberedSource, ...renumberedTarget];
}

export function useCards(boardId: Id) {
  return useQuery({
    queryKey: qk.cards(boardId),
    queryFn: () => cardsApi.listCards(boardId),
    enabled: Boolean(boardId),
  });
}

export function useCardDetail(
  boardId: Id,
  cardId: Id | null,
  members: UserRef[],
) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.card(boardId, cardId ?? "none"),
    queryFn: () => cardsApi.getCard(boardId, cardId as string, members),
    enabled: Boolean(boardId && cardId),
    // The board already holds the card's title, labels, people and dates.
    // Showing those at once lets the dialog open on the click instead of
    // after the detail request; `isPlaceholderData` marks what is still due.
    placeholderData: () => {
      const summary = qc
        .getQueryData<CardSummary[]>(qk.cards(boardId))
        ?.find((c) => c.id === cardId);
      return summary ? { ...summary, subtasks: [], comments: [] } : undefined;
    },
  });
}

/** Marks rows that exist only locally until the server answers. */
export const TEMP_ID_PREFIX = "tmp-";
let tempSeq = 0;
const tempId = () => `${TEMP_ID_PREFIX}${Date.now().toString(36)}-${tempSeq++}`;

export interface CardMutationContext {
  /** Resolves assignee ids to people for the optimistic view. */
  members?: UserRef[];
  /** Author shown on a comment before the server confirms it. */
  currentUser?: UserRef;
}

export function useCardMutations(boardId: Id, ctx: CardMutationContext = {}) {
  const qc = useQueryClient();
  const cardsKey = qk.cards(boardId);
  // Shared so a settle can tell whether another edit to the board is still in
  // flight before it re-reads anything.
  const mutationKey = ["card-edit", boardId] as const;

  const invalidateBoard = () => qc.invalidateQueries({ queryKey: cardsKey });

  /**
   * Create and update both answer with the authoritative card, so the board
   * list can be updated from the response. Refetching it would ask the server
   * to re-send data this client is already holding.
   */
  const writeCard = (card: CardSummary) => {
    qc.setQueryData<CardSummary[]>(cardsKey, (prev) => {
      if (!prev) return prev;
      const idx = prev.findIndex((c) => c.id === card.id);
      if (idx === -1) return [...prev, card];
      const next = [...prev];
      next[idx] = card;
      return next;
    });
  };

  /**
   * Applies an edit to the cached detail and summary before the request is
   * sent, and hands back what is needed to undo it. Every control in the card
   * dialog is bound to these caches, so without this each one would show its
   * old value until a write and a refetch had both come back.
   */
  const applyOptimistic = (
    cardId: Id,
    editDetail: (d: CardDetail) => CardDetail,
    editSummary: (s: CardSummary) => CardSummary = (s) => s,
  ) => {
    const detailKey = qk.card(boardId, cardId);
    void qc.cancelQueries({ queryKey: detailKey });
    const prevDetail = qc.getQueryData<CardDetail>(detailKey);
    const prevCards = qc.getQueryData<CardSummary[]>(cardsKey);
    if (prevDetail) qc.setQueryData<CardDetail>(detailKey, editDetail(prevDetail));
    if (prevCards) {
      qc.setQueryData<CardSummary[]>(
        cardsKey,
        prevCards.map((c) => (c.id === cardId ? editSummary(c) : c)),
      );
    }
    return { detailKey, prevDetail, prevCards };
  };

  type Undo = ReturnType<typeof applyOptimistic>;
  const rollback = (_e: unknown, _v: unknown, undo: Undo | undefined) => {
    if (!undo) return;
    if (undo.prevDetail) qc.setQueryData(undo.detailKey, undo.prevDetail);
    if (undo.prevCards) qc.setQueryData(cardsKey, undo.prevCards);
  };

  /**
   * Confirms the optimistic state against the server once the last edit in a
   * burst has landed. Re-reading after each one would briefly restore a value
   * the user has already changed again.
   */
  const confirm = (cardId: Id) => {
    if (qc.isMutating({ mutationKey }) > 1) return;
    void qc.invalidateQueries({ queryKey: qk.card(boardId, cardId) });
  };

  const patchSummary = (patch: CardPatch) => (c: CardSummary): CardSummary => {
    const next: CardSummary = { ...c };
    if (patch.title !== undefined) next.title = patch.title;
    if (patch.labels !== undefined) next.labels = patch.labels;
    if (patch.priority !== undefined) next.priority = patch.priority;
    if (patch.dueDate !== undefined) {
      if (patch.dueDate === null) delete next.dueDate;
      else next.dueDate = patch.dueDate;
    }
    if (patch.assigneeIds !== undefined) {
      const known = new Map(
        [...(ctx.members ?? []), ...c.assignees].map((u) => [u.id, u]),
      );
      next.assignees = patch.assigneeIds.map(
        (id) => known.get(id) ?? { id, name: "…" },
      );
    }
    return next;
  };

  return {
    createCard: useMutation({
      mutationFn: (input: { title: string; columnId: string }) =>
        cardsApi.createCard(boardId, input),
      onSuccess: writeCard,
    }),

    updateCard: useMutation({
      mutationKey,
      mutationFn: (args: { cardId: Id; patch: CardPatch }) =>
        cardsApi.updateCard(boardId, args.cardId, args.patch),
      onMutate: ({ cardId, patch }) =>
        applyOptimistic(
          cardId,
          (d) => {
            const next = { ...d, ...patchSummary(patch)(d) } as CardDetail;
            if (patch.description !== undefined) {
              if (patch.description) next.description = patch.description;
              else delete next.description;
            }
            return next;
          },
          patchSummary(patch),
        ),
      onError: rollback,
      onSuccess: (card) => writeCard(card),
      onSettled: (_d, _e, args) => confirm(args.cardId),
    }),

    moveCard: useMutation({
      mutationFn: (args: { cardId: Id; columnId: string; order: number }) =>
        cardsApi.moveCard(boardId, args.cardId, {
          columnId: args.columnId,
          order: args.order,
        }),
      onMutate: (args: { cardId: Id; columnId: string; order: number }) => {
        void qc.cancelQueries({ queryKey: cardsKey });
        const prev = qc.getQueryData<CardSummary[]>(cardsKey);
        if (prev) {
          qc.setQueryData<CardSummary[]>(
            cardsKey,
            applyCardMove(prev, args.cardId, args.columnId, args.order),
          );
        }
        return { prev };
      },
      onError: (_e, _v, undo) => {
        const prev = (undo as { prev?: CardSummary[] } | undefined)?.prev;
        if (prev) qc.setQueryData(cardsKey, prev);
      },
      onSettled: invalidateBoard,
    }),

    deleteCard: useMutation({
      mutationFn: (cardId: Id) => cardsApi.deleteCard(boardId, cardId),
      onSuccess: (_void, cardId) => {
        qc.setQueryData<CardSummary[]>(cardsKey, (prev) =>
          prev?.filter((c) => c.id !== cardId),
        );
        qc.removeQueries({ queryKey: qk.card(boardId, cardId) });
      },
    }),

    addSubtask: useMutation({
      mutationKey,
      mutationFn: (args: { cardId: Id; title: string }) =>
        cardsApi.addSubtask(args.cardId, args.title),
      onMutate: ({ cardId, title }) =>
        applyOptimistic(
          cardId,
          (d) => ({
            ...d,
            subtasks: [...d.subtasks, { id: tempId(), title, done: false }],
            subtaskTotal: d.subtaskTotal + 1,
          }),
          (s) => ({ ...s, subtaskTotal: s.subtaskTotal + 1 }),
        ),
      onError: rollback,
      onSettled: (_d, _e, args) => confirm(args.cardId),
    }),

    toggleSubtask: useMutation({
      mutationKey,
      mutationFn: (args: { cardId: Id; subtaskId: Id; done: boolean }) =>
        cardsApi.updateSubtask(args.cardId, args.subtaskId, { done: args.done }),
      onMutate: ({ cardId, subtaskId, done }) => {
        const shift = (n: number) => Math.max(0, n + (done ? 1 : -1));
        return applyOptimistic(
          cardId,
          (d) => {
            const was = d.subtasks.find((s) => s.id === subtaskId)?.done;
            if (was === undefined || was === done) return d;
            return {
              ...d,
              subtasks: d.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, done } : s,
              ),
              subtaskDone: shift(d.subtaskDone),
            };
          },
          (s) => ({ ...s, subtaskDone: shift(s.subtaskDone) }),
        );
      },
      onError: rollback,
      onSettled: (_d, _e, args) => confirm(args.cardId),
    }),

    editSubtask: useMutation({
      mutationKey,
      mutationFn: (args: { cardId: Id; subtaskId: Id; title: string }) =>
        cardsApi.updateSubtask(args.cardId, args.subtaskId, { title: args.title }),
      onMutate: ({ cardId, subtaskId, title }) =>
        applyOptimistic(cardId, (d) => ({
          ...d,
          subtasks: d.subtasks.map((s) => (s.id === subtaskId ? { ...s, title } : s)),
        })),
      onError: rollback,
      onSettled: (_d, _e, args) => confirm(args.cardId),
    }),

    deleteSubtask: useMutation({
      mutationKey,
      mutationFn: (args: { cardId: Id; subtaskId: Id }) =>
        cardsApi.deleteSubtask(args.cardId, args.subtaskId),
      onMutate: ({ cardId, subtaskId }) => {
        let wasDone = false;
        return applyOptimistic(
          cardId,
          (d) => {
            wasDone = Boolean(d.subtasks.find((s) => s.id === subtaskId)?.done);
            return {
              ...d,
              subtasks: d.subtasks.filter((s) => s.id !== subtaskId),
              subtaskTotal: Math.max(0, d.subtaskTotal - 1),
              subtaskDone: Math.max(0, d.subtaskDone - (wasDone ? 1 : 0)),
            };
          },
          (s) => ({
            ...s,
            subtaskTotal: Math.max(0, s.subtaskTotal - 1),
            subtaskDone: Math.max(0, s.subtaskDone - (wasDone ? 1 : 0)),
          }),
        );
      },
      onError: rollback,
      onSettled: (_d, _e, args) => confirm(args.cardId),
    }),

    addComment: useMutation({
      mutationKey,
      mutationFn: (args: { cardId: Id; body: string }) =>
        cardsApi.addComment(args.cardId, args.body),
      onMutate: ({ cardId, body }) =>
        applyOptimistic(
          cardId,
          (d) => ({
            ...d,
            comments: [
              ...d.comments,
              {
                id: tempId(),
                body,
                createdAt: new Date().toISOString(),
                author: ctx.currentUser ?? { id: "", name: "You" },
              },
            ],
            commentCount: d.commentCount + 1,
          }),
          (s) => ({ ...s, commentCount: s.commentCount + 1 }),
        ),
      onError: rollback,
      onSettled: (_d, _e, args) => confirm(args.cardId),
    }),

    deleteComment: useMutation({
      mutationKey,
      mutationFn: (args: { cardId: Id; commentId: Id }) =>
        cardsApi.deleteComment(args.cardId, args.commentId),
      onMutate: ({ cardId, commentId }) =>
        applyOptimistic(
          cardId,
          (d) => ({
            ...d,
            comments: d.comments.filter((c) => c.id !== commentId),
            commentCount: Math.max(0, d.commentCount - 1),
          }),
          (s) => ({ ...s, commentCount: Math.max(0, s.commentCount - 1) }),
        ),
      onError: rollback,
      onSettled: (_d, _e, args) => confirm(args.cardId),
    }),
  };
}
