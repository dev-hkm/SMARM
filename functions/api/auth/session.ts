import { getSessionUserId } from "../../lib/auth";
import { Env, publicUser } from "../../lib/data";
import { error, json } from "../../lib/http";

type UserRow = { id: string; name: string; username: string };

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  const userId = await getSessionUserId(request, env);
  if (!userId) return error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);
  const user = await env.SMARM_DB.prepare("SELECT id, name, username FROM users WHERE id = ?")
    .bind(userId)
    .first<UserRow>();
  if (!user) return error("Tài khoản không còn tồn tại. Vui lòng đăng nhập lại.", 401);
  return json({ status: "success", ok: true, user: publicUser(user) });
}
