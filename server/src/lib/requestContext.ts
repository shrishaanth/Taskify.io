import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestHandler } from "express";

export interface RequestContext {
  /**
   * Socket.IO id of the client that issued this request, when it sent one.
   * Realtime emitters skip this socket so the actor is not told about a change
   * it already applied from the HTTP response.
   */
  originSocketId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Reads the header once per request and pins it to the async context. */
export const requestContext: RequestHandler = (req, _res, next) => {
  const header = req.header("x-socket-id");
  const originSocketId =
    typeof header === "string" && header.length > 0 && header.length <= 64
      ? header
      : undefined;
  storage.run(originSocketId ? { originSocketId } : {}, () => next());
};

export function getOriginSocketId(): string | undefined {
  return storage.getStore()?.originSocketId;
}
