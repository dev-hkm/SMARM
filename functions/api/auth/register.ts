import { createSession, hashPassword } from "../../lib/auth";
import { Env, publicUser } from "../../lib/data";
import { error, json, readJson } from "../../lib/http";

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 80) return error("Họ tên cần có từ 2 đến 80 ký tự.");
  if (!/^[a-z0-9_.-]{3,32}$/i.test(username)) return error("Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.");
  if (password.length < 8 || password.length > 128) return error("Mật khẩu cần có từ 8 đến 128 ký tự.");

  const existing = await env.SMARM_DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  if (existing) return error("Tên đăng nhập đã tồn tại.", 409);

  const id = crypto.randomUUID();
  const { hash, salt } = await hashPassword(password);
  try {
    await env.SMARM_DB.prepare("INSERT INTO users (id, username, name, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)")
      .bind(id, username, name, hash, salt).run();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/UNIQUE|unique constraint/i.test(message)) {
      return error("Tên đăng nhập đã tồn tại.", 409);
    }
    throw err;
  }
  await env.SMARM_DB.prepare("INSERT INTO user_data (user_id, payload) VALUES (?, '{}')").bind(id).run();
  const user = publicUser({ id, name, username });
  return json({ status: "success", ok: true, user }, 201, { "set-cookie": await createSession(id, request, env) });
}
