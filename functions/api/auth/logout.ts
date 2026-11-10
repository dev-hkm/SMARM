import { clearSession } from "../../lib/auth";
import { json } from "../../lib/http";

export function onRequestPost({ request }: { request: Request }) {
  return json({ status: "success", ok: true }, 200, { "set-cookie": clearSession(request) });
}
