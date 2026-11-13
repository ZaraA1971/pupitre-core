import { requireBasicAuth } from "../_shared/auth.js";

export async function onRequest(context) {
  const denied = requireBasicAuth(context.request, context.env);
  if (denied) return denied;
  return context.next();
}
