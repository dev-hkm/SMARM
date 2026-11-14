import { Env, requireUserId } from "../../lib/data";
import { error, json, readJson } from "../../lib/http";

type DataRow = { payload: string };
const MAX_PAYLOAD_BYTES = 1_500_000;

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  const userId = await requireUserId(request, env);
  if (!userId) return error("Phiên đăng nhập đã hết hạn.", 401);
  const row = await env.SMARM_DB.prepare("SELECT payload FROM user_data WHERE user_id = ?").bind(userId).first<DataRow>();
  try {
    return json({ status: "success", ok: true, userData: row ? JSON.parse(row.payload) : {} });
  } catch {
    return json({ status: "success", ok: true, userData: {} });
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  const userId = await requireUserId(request, env);
  if (!userId) return error("Phiên đăng nhập đã hết hạn.", 401);
  const body = await readJson(request);
  const userData = body?.userData;
  if (!userData || typeof userData !== "object" || Array.isArray(userData)) return error("Dữ liệu đồng bộ không hợp lệ.");
  // A tab that still holds another account's snapshot must not overwrite this user.
  const claimedUserId = typeof body?.userId === "string" ? body.userId : "";
  if (claimedUserId && claimedUserId !== userId) {
    return error("Tài khoản đăng nhập đã thay đổi. Dữ liệu chưa được đồng bộ.", 409);
  }
  const payload = JSON.stringify(userData);
  if (new TextEncoder().encode(payload).byteLength > MAX_PAYLOAD_BYTES) return error("Dữ liệu đồng bộ vượt giới hạn 1.5 MB.", 413);
  await env.SMARM_DB.prepare(
    "INSERT INTO user_data (user_id, payload, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP",
  ).bind(userId, payload).run();
  return json({ status: "success", ok: true, message: "Đã đồng bộ dữ liệu." });
}
