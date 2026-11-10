import { createSession, verifyPassword } from "../../lib/auth";
import { Env, publicUser } from "../../lib/data";
import { error, json, readJson } from "../../lib/http";

type UserRow = { id: string; name: string; username: string; password_hash: string; password_salt: string };

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const body = await readJson(request);
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) return error("Vui lòng nhập tên đăng nhập và mật khẩu.");
  const user = await env.SMARM_DB.prepare("SELECT id, name, username, password_hash, password_salt FROM users WHERE username = ?")
    .bind(username).first<UserRow>();
  if (!user || !(await verifyPassword(password, user.password_salt, user.password_hash))) {
    return error("Sai tên đăng nhập hoặc mật khẩu.", 401);
  }
  return json({ status: "success", ok: true, user: publicUser(user) }, 200, { "set-cookie": await createSession(user.id, request, env) });
}
