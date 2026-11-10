export type Env = { SMARM_DB: D1Database; AUTH_SECRET: string };

export async function requireUserId(request: Request, env: Env) {
  const { getSessionUserId } = await import("./auth");
  return getSessionUserId(request, env);
}

export function publicUser(user: { id: string; name: string; username: string }) {
  return { userId: user.id, name: user.name, username: user.username };
}
