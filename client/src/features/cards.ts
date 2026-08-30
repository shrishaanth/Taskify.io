import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as cardsApi from "../api/cards";
import type { CardPatch, Id, UserRef } from "../types/domain";
import { qk } from "./queryClient";

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
      onSuccess: invalidateBoard,
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
    addAttachment: useMutation({
      mutationFn: (args: {
        cardId: Id;
        meta: {
          fileName: string;
          fileUrl: string;
          mimeType: string;
          sizeBytes: number;
        };
      }) => cardsApi.addAttachment(args.cardId, args.meta),
      onSuccess: invalidateCard,
    }),
    deleteAttachment: useMutation({
      mutationFn: (args: { cardId: Id; attachmentId: Id }) =>
        cardsApi.deleteAttachment(args.cardId, args.attachmentId),
      onSuccess: invalidateCard,
    }),
  };
}
