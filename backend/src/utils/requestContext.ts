import { AsyncLocalStorage } from "node:async_hooks";

export interface ActorContext {
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  reasonForChange?: string;
}

export const requestContextStorage = new AsyncLocalStorage<ActorContext>();

export function getActorContext(): ActorContext | undefined {
  return requestContextStorage.getStore();
}

export function setActorContext(context: ActorContext, callback: () => void) {
  return requestContextStorage.run(context, callback);
}
