import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as cardsApi from "../api/cards";
import type { CardPatch, CardSummary, Id, UserRef } from "../types/domain";
import { qk } from "./queryClient";

/**
 * Pure helper: return the card list with `cardId` moved to `toColumnId` at
 * `order`, with both the source and target columns renumbered. Used for the
 * optimistic drag-and-drop update so the card animates into place immediately;
 * the server response then reconciles (and, landing in the same spot, causes
 * no second animation — software-spec §6).
 */
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
  return useQuery({
    queryKey: qk.card(boardId, cardId ?? "none"),
    queryFn: () => cardsApi.getCard(boardId, cardId as string, members),
    enabled: Boolean(boardId && cardId),
  });
}

/** All card + child mutations for a board, invalidating the right keys. */
export function useCardMutations(boardId: Id, openCardId?: Id | null) {
  const qc = useQueryClient();
  const invalidateBoard = () =>
    qc.invalidateQueries({ queryKey: qk.cards(boardId) });
  const invalidateCard = () => {
    if (openCardId) {
      qc.invalidateQueries({ queryKey: qk.card(boardId, openCardId) });
    }
    invalidateBoard();
  };

  return {
    createCard: useMutation({
      mutationFn: (input: { title: string; columnId: string }) =>
        cardsApi.createCard(boardId, input),
      onSuccess: invalidateBoard,
    }),
    updateCard: useMutation({
      mutationFn: (args: { cardId: Id; patch: CardPatch }) =>
        cardsApi.updateCard(boardId, args.cardId, args.patch),
      onSuccess: invalidateCard,
    }),
    moveCard: useMutation({
      mutationFn: (args: { cardId: Id; columnId: string; order: number }) =>
        cardsApi.moveCard(boardId, args.cardId, {
          columnId: args.columnId,
          order: args.order,
        }),
      // Optimistic: move the card in the cache now so it animates once.
      onMutate: async (args: {
        cardId: Id;
        columnId: string;
        order: number;
      }) => {
        await qc.cancelQueries({ queryKey: qk.cards(boardId) });
        const prev = qc.getQueryData<CardSummary[]>(qk.cards(boardId));
        if (prev) {
          qc.setQueryData<CardSummary[]>(
            qk.cards(boardId),
            applyCardMove(prev, args.cardId, args.columnId, args.order),
          );
        }
        return { prev };
      },
      onError: (_e, _v, ctx) => {
        const prev = (ctx as { prev?: CardSummary[] } | undefined)?.prev;
        if (prev) qc.setQueryData(qk.cards(boardId), prev);
      },
      onSettled: invalidateBoard,
    }),
    deleteCard: useMutation({
      mutationFn: (cardId: Id) => cardsApi.deleteCard(boardId, cardId),
      onSuccess: invalidateBoard,
    }),
    addSubtask: useMutation({
      mutationFn: (args: { cardId: Id; title: string }) =>
        cardsApi.addSubtask(args.cardId, args.title),
      onSuccess: invalidateCard,
    }),
    toggleSubtask: useMutation({
      mutationFn: (args: { cardId: Id; subtaskId: Id; done: boolean }) =>
        cardsApi.updateSubtask(args.cardId, args.subtaskId, { done: args.done }),
      onSuccess: invalidateCard,
    }),
    addComment: useMutation({
      mutationFn: (args: { cardId: Id; body: string }) =>
        cardsApi.addComment(args.cardId, args.body),
      onSuccess: invalidateCard,
    }),
    deleteComment: useMutation({
      mutationFn: (args: { cardId: Id; commentId: Id }) =>
        cardsApi.deleteComment(args.cardId, args.commentId),
      onSuccess: invalidateCard,
    }),
  };
}
