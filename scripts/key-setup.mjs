import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const DEV_VARS = resolve(process.cwd(), ".dev.vars");
const ENV_EXAMPLE = resolve(process.cwd(), ".env.example");
const DEFAULT_PORT = Number(process.env.KEY_FORM_PORT || 4321);
const DEFAULT_MODEL = "zai-org/GLM-5.3-Flash";

function readDevVars() {
  if (!existsSync(DEV_VARS)) {
    if (existsSync(ENV_EXAMPLE)) {
      writeFileSync(DEV_VARS, readFileSync(ENV_EXAMPLE, "utf8"), "utf8");
    } else {
      writeFileSync(DEV_VARS, "", "utf8");
    }
  }
  return readFileSync(DEV_VARS, "utf8");
}

function currentValue(raw, name) {
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || match[1] !== name) continue;
    return match[2].trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

function setValue(raw, name, value) {
  const entry = `${name}="${value}"`;
  const lines = raw.split(/\r?\n/);
  let replaced = false;
  const next = lines.map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (match && match[1] === name) {
      if (replaced) return null;
      replaced = true;
      return entry;
    }
    return line;
  });
  const kept = next.filter((line) => line !== null);
  if (!replaced) kept.push(entry);
  return `${kept.join("\n").replace(/\n+$/, "")}\n`;
}

function page(hasKey, model) {
  const status = hasKey
    ? '<span class="pill ok">Đã có key</span>'
    : '<span class="pill warn">Chưa có key</span>';
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SMARM · Nhập khoá River</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
    background: #fffbdf; color: #111;
    font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
  }
  main {
    width: min(560px, 100%); background: #fff; border: 4px solid #000;
    box-shadow: 8px 8px 0 #000; padding: 32px;
  }
  h1 { margin: 0 0 6px; font-size: 24px; text-transform: uppercase; letter-spacing: -0.03em; }
  p.sub { margin: 0 0 22px; color: #555; font-size: 14px; line-height: 1.6; }
  .row { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  .pill {
    font-size: 12px; font-weight: 800; padding: 4px 10px; border: 2px solid #000;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .pill.ok { background: #b8f5c8; }
  .pill.warn { background: #ffd0d0; }
  label { display: block; font-size: 13px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
  .field { position: relative; }
  input {
    width: 100%; font: inherit; font-size: 15px; padding: 12px 44px 12px 14px;
    border: 3px solid #000; background: #fff; outline: none;
    box-shadow: 4px 4px 0 #000;
  }
  input:focus { background: #fffbdf; }
  button.eye {
    position: absolute; top: 3px; right: 3px; bottom: 3px; width: 38px; border: 0;
    background: transparent; font-size: 16px; cursor: pointer;
  }
  .hint { font-size: 12px; color: #666; margin-top: 8px; line-height: 1.5; }
  button.save {
    width: 100%; margin-top: 22px; padding: 14px; font: inherit; font-size: 16px;
    font-weight: 900; text-transform: uppercase; letter-spacing: 0.02em;
    border: 3px solid #000; background: #ffde47; color: #000; cursor: pointer;
    box-shadow: 4px 4px 0 #000; transition: transform 0.1s, box-shadow 0.1s;
  }
  button.save:hover { background: #ffe873; }
  button.save:active { transform: translate(4px, 4px); box-shadow: none; }
  button.save:disabled { opacity: 0.55; cursor: wait; }
  #msg { margin-top: 16px; font-size: 14px; font-weight: 700; line-height: 1.5; min-height: 21px; }
  #msg.ok { color: #0a6b2d; }
  #msg.err { color: #b00020; }
  .next { margin-top: 18px; padding: 14px; border: 2px dashed #000; background: #f6f6f6; font-size: 13px; line-height: 1.6; display: none; }
  .next b { display: block; margin-bottom: 4px; }
  code { background: #ececec; padding: 1px 5px; border-radius: 3px; }
</style>
</head>
<body>
<main>
  <h1>Khoá River</h1>
  <p class="sub">Dán khoá API River vào đây. Khoá chỉ được ghi vào tệp <code>.dev.vars</code> trên máy này, không gửi đi đâu khác.</p>
  <div class="row">${status}</div>
  <form id="form">
    <label for="key">River API key</label>
    <div class="field">
      <input id="key" type="password" autocomplete="off" spellcheck="false" placeholder="rv-..." required />
      <button class="eye" type="button" id="eye" aria-label="Hiện hoặc ẩn khoá">Hiện</button>
    </div>
    <div class="hint">Dán nguyên khoá, không thêm dấu cách hay dấu ngoặc kép.</div>

    <label for="model" style="margin-top:18px">Mô hình</label>
    <div class="field">
      <input id="model" type="text" autocomplete="off" spellcheck="false" value="${model}" />
    </div>
    <div class="hint">Mặc định là mô hình có trong tài liệu River. Chỉ đổi nếu tài khoản của bạn dùng mã khác.</div>

    <button class="save" type="submit" id="save">Lưu vào máy</button>
  </form>
  <div id="msg" role="status"></div>
  <div class="next" id="next">
    <b>Đã lưu xong.</b>
    Giờ chỉ cần nhắn cho trợ lý là “đã nhập key River”, trợ lý sẽ đẩy khoá lên Cloudflare và deploy giúp bạn.
  </div>
</main>
<script>
  const form = document.getElementById("form");
  const keyInput = document.getElementById("key");
  const modelInput = document.getElementById("model");
  const saveBtn = document.getElementById("save");
  const msg = document.getElementById("msg");
  const next = document.getElementById("next");
  const eye = document.getElementById("eye");

  eye.addEventListener("click", () => {
    const show = keyInput.type === "password";
    keyInput.type = show ? "text" : "password";
    eye.textContent = show ? "Ẩn" : "Hiện";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    msg.className = "";
    msg.textContent = "";
    next.style.display = "none";
    const key = keyInput.value.trim();
    const model = modelInput.value.trim();
    if (!key) { msg.className = "err"; msg.textContent = "Bạn chưa dán khoá."; return; }

    saveBtn.disabled = true;
    saveBtn.textContent = "Đang lưu...";
    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, model }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || "Không lưu được.");
      msg.className = "ok";
      msg.textContent = "Đã ghi vào .dev.vars.";
      keyInput.value = "";
      next.style.display = "block";
    } catch (error) {
      msg.className = "err";
      msg.textContent = error.message || "Có lỗi, thử lại giúp mình.";
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Lưu vào máy";
    }
  });
</script>
</body>
</html>`;
}

const server = createServer((req, res) => {
  const headers = {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  };

  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const raw = readDevVars();
    const hasKey = currentValue(raw, "RIVER_API_KEY").length > 0;
    const model = currentValue(raw, "RIVER_MODEL") || DEFAULT_MODEL;
    res.writeHead(200, { ...headers, "content-type": "text/html; charset=utf-8" });
    res.end(page(hasKey, model));
    return;
  }

  if (req.method === "POST" && req.url === "/api/save") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 16_384) req.destroy();
    });
    req.on("end", () => {
      const send = (status, payload) => {
        res.writeHead(status, { ...headers, "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(payload));
      };

      let parsed;
      try {
        parsed = JSON.parse(body || "{}");
      } catch {
        send(400, { ok: false, message: "Dữ liệu không hợp lệ." });
        return;
      }

      const key = typeof parsed.key === "string" ? parsed.key.trim().replace(/^["']|["']$/g, "") : "";
      const model = typeof parsed.model === "string" ? parsed.model.trim() : "";

      if (!key) {
        send(400, { ok: false, message: "Khoá đang trống." });
        return;
      }
      if (/[\s"'`\\]/.test(key)) {
        send(400, { ok: false, message: "Khoá chứa ký tự không hợp lệ (dấu cách, ngoặc kép...)." });
        return;
      }
      if (key.length > 4096) {
        send(400, { ok: false, message: "Khoá quá dài." });
        return;
      }
      if (model && !/^[A-Za-z0-9._/-]{1,120}$/.test(model)) {
        send(400, { ok: false, message: "Mã mô hình không hợp lệ." });
        return;
      }

      let raw = readDevVars();
      raw = setValue(raw, "RIVER_API_KEY", key);
      if (model) raw = setValue(raw, "RIVER_MODEL", model);
      writeFileSync(DEV_VARS, raw, { encoding: "utf8", mode: 0o600 });
      try {
        chmodSync(DEV_VARS, 0o600);
      } catch {
        // Windows does not always honor POSIX modes; the file is already local-only.
      }
      console.log("RIVER_API_KEY saved to .dev.vars");
      send(200, { ok: true });
    });
    return;
  }

  res.writeHead(404, { ...headers, "content-type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

let port = DEFAULT_PORT;
let tries = 0;

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && tries < 10) {
    tries += 1;
    port += 1;
    server.listen(port, "127.0.0.1");
    return;
  }
  console.error("Không mở được form:", error.message);
  process.exit(1);
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(`Key form: ${url}`);
  if (process.env.KEY_FORM_NO_OPEN !== "1" && process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true }).unref();
  }
});
