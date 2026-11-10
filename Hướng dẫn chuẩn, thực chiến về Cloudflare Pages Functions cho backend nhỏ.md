# Hướng dẫn chuẩn, thực chiến về Cloudflare Pages Functions cho backend nhỏ

## 1. Tổng quan: Cloudflare Pages + Functions là gì

Cloudflare Pages là nền tảng deploy web tĩnh (HTML/CSS/JS) thông qua Git hoặc lệnh `wrangler pages deploy`, chạy trên hạ tầng edge của Cloudflare. Pages Functions là lớp backend serverless chạy trên nền Cloudflare Workers, nhưng gắn trực tiếp với dự án Pages, cho phép bạn viết logic server-side (API, auth, proxy AI, xử lý form, v.v.) mà không cần dựng server riêng.[^1][^2][^3][^4]

Điểm quan trọng: chỉ cần tạo thư mục `functions/` ở **root của repo** (không phải trong `dist`, `public` hay thư mục build khác), mỗi file trong đó sẽ được build thành một route tương ứng và chạy trên edge như một Worker. Điều này giúp bạn biến một site tĩnh thành full-stack (frontend + backend nhỏ) nhưng vẫn giữ workflow Pages quen thuộc (connect Git, build, deploy tự động).[^5][^2][^4][^1]

## 2. Kiến trúc cơ bản và lifecycle request

Khi người dùng truy cập vào một URL trên site Pages, Cloudflare sẽ áp dụng cơ chế routing: nếu URL đó khớp với một file trong `functions/` theo quy ước đặt tên, request sẽ được xử lý bởi code Functions; nếu không có function tương ứng, request sẽ rơi về static asset (HTML/CSS/JS) trong output build (`dist`, `public`, v.v.).[^6][^1]

Mỗi function là một module export handler như `onRequest`, nhận vào context chứa `request`, `env`, `params` và phải trả về một `Response` hoặc `Promise<Response>`. Bạn có thể dùng full Cloudflare Workers runtime: fetch tới API khác, đọc env vars, truy cập D1, R2, KV, v.v., y như một Worker bình thường.[^2][^7][^1]

## 3. Cấu trúc repo đúng chuẩn cho Pages Functions

Để Pages nhận Functions, repo của bạn tối thiểu cần cấu trúc dạng:

```text
.
├── functions/
│   ├── api/
│   │   └── hello.js
│   └── [[path]].js
├── src/ ... (tuỳ framework)
├── package.json
└── ...
```

Thư mục `functions/` phải nằm ở **gốc repo** chứ không nằm trong thư mục build như `dist/`, `out/`, `.next/`, v.v. Build command sẽ tạo ra thư mục output (ví dụ `dist/` với Vite, `public/` với nhiều framework khác) và bạn chỉ cần cấu hình Pages để build từ repo này; Cloudflare sẽ tự scan `functions/` ở root và build thành Worker Functions.[^3][^1][^5]

Nếu bạn đang dùng `wrangler pages deploy ./dist`, cần lưu ý: để deploy được Functions, bạn nên cấu hình `pages_build_output_dir` trong config Wrangler thay vì chỉ upload một thư mục build trơ có `index.html`. Cách tốt nhất cho workflow AI build web (Vite) là: giữ nguyên code nguồn + `functions/` trong repo (GitHub), để Pages build từ source rồi gắn Functions trong cùng pipeline.[^8][^9][^5][^3]

## 4. Mapping route từ tên file trong `functions/`

Cloudflare Pages dùng file-based routing cho Functions: đường dẫn URL được suy ra từ cấu trúc thư mục và tên file trong `functions/`.[^10][^1][^6]

Một số quy tắc cơ bản:

- `functions/helloworld.js` → route `/helloworld`.[^1]
- `functions/api/submit.ts` → route `/api/submit`.[^5]
- `functions/date.js` → route `/date`.[^6]
- Nếu có cả static asset và function trùng route, thường static asset sẽ được ưu tiên, trừ khi dùng `_routes.json` để điều chỉnh.[^11][^6]

Dynamic routes dùng cú pháp giống Next.js / file-based router:

- `functions/users/[user].js` → khớp `/users/daniel`, `/users/nevi`, tham số đọc qua `context.params.user`.[^10][^6]
- `functions/users/special.js` → route `/users/special`, override route dynamic nếu trùng.[^6]
- `functions/users/[[catchall]].js` → catch-all nhiều segment: `/users/daniel/xyz/123` sẽ có `context.params.catchall = ['daniel', 'xyz', '123']`.[^10][^6]

Bạn có thể dùng thử repo demo routing hoặc bảng mapping routes trong docs/guide cộng đồng để hiểu rõ hơn khi kết hợp static HTML với dynamic Functions.[^12][^6]

## 5. Viết một Pages Function đơn giản

Docs chính thức hướng dẫn tạo file `functions/helloworld.js` với handler `onRequest` như sau:[^1]

```js
export async function onRequest(context) {
  return new Response("Hello, world!", {
    headers: { "content-type": "text/plain" },
  });
}
```

Handler `onRequest` nhận một object `context` chứa tối thiểu `request`, ngoài ra trong runtime thật còn có `env`, `params`, `next`, v.v., tuỳ loại function (middleware, page, API). Hàm phải return `Response` hoặc `Promise<Response>`, vì nó chạy trên runtime Workers chuẩn.[^7][^2][^1]

Nếu muốn xử lý JSON (API), pattern phổ biến là parse `request.json()` và trả `Response` với header `content-type: application/json`:[^7]

```js
export async function onRequest({ request }) {
  const data = await request.json();
  return new Response(JSON.stringify({ ok: true, data }), {
    headers: { "content-type": "application/json" },
  });
}
```

## 6. Build config trên dashboard: Build command, output dir, root

Trong Cloudflare Pages dashboard, mỗi project có phần **Build & deployments** để cấu hình:

- Build command (ví dụ: `npm run build`).
- Build output directory (ví dụ: `dist` cho Vite, `public` cho nhiều framework).[^3]
- Root directory (khi repo có nhiều project, hoặc source nằm trong subfolder).[^13][^3]

Docs cung cấp bảng preset: với React (Vite) build command thường là `npm run build`, output là `dist`. Nếu bạn không cần build (site tĩnh thuần HTML), có thể dùng build command `exit 0` và trỏ output tới thư mục chứa file HTML.[^3]

Điều quan trọng là: Cloudflare build từ **root directory** mà bạn chỉ định (thường là `/`), đọc code source (bao gồm `functions/`), chạy build command, và lấy output từ build directory để phục vụ static assets. Nếu bạn chỉ upload riêng thư mục build (dist) mà không có `functions/`, Pages sẽ không thấy Functions và coi đó là site tĩnh thuần.[^9][^5][^1][^3]

## 7. Config bằng Wrangler: deploy Pages + Functions bằng CLI

Ngoài dashboard, bạn có thể dùng Wrangler SDK để deploy Pages + Functions. Trong file `wrangler.toml` hoặc `wrangler.json`, cấu hình quan trọng cho Pages là `pages_build_output_dir` trỏ tới build output (ví dụ `./dist`) và `compatibility_date` cùng các `compatibility_flags` nếu cần Node.js compat.[^8][^5]

Ví dụ config (JSON style):

```json
{
  "name": "my-site",
  "pages_build_output_dir": "./dist",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"]
}
```

Các lệnh deploy tiêu biểu:

```bash
# Deploy lần đầu
yarn wrangler pages deploy ./dist --project-name my-site

# Deploy sau đó (project name đã được nhớ)
yarn wrangler pages deploy ./dist

# Deploy lên branch cụ thể
wrangler pages deploy ./dist --branch production
```

Wrangler cho phép bạn preview local với `wrangler pages dev ./dist` để kiểm tra Functions + static assets trước khi đẩy lên production.[^5][^8]

## 8. API reference: env, ASSETS, fetch static từ Function

Pages Functions dùng chung API của Workers, với một số điểm đặc thù.[^2][^7]

- `onRequest` là entrypoint chính cho Requests-based Functions.[^7][^1]
- `env` chứa bindings: D1, R2, KV, Secrets, và `ASSETS` để fetch static files.[^7]
- `env.ASSETS.fetch(request)` cho phép bạn fetch một static asset từ site của bạn (ví dụ trả về HTML do framework build ra rồi wrap thêm header/logic).[^7]

Lưu ý khi dùng `env.ASSETS.fetch`: URL phải là “pretty path”, không trỏ trực tiếp tới file `.html`. Nếu asset là `/users/index.html`, bạn phải gọi `/users/` để ASSETS tự tìm file, áp dụng redirect/headers như trong config.[^7]

## 9. Routing nâng cao: wildcard, static fallback, `_routes.json`

Khi kết hợp site SPA (React Router, Next static) với Functions, routing có thể phức tạp. Cloudflare hỗ trợ `_routes.json` để điều khiển include/exclude route nào đi qua Functions.[^14][^11]

Một ví dụ `_routes.json` phổ biến:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/favicon.ico",
    "/favicon.png",
    "/assets/*",
    "/images/*",
    "/_next/static/*"
  ]
}
```

Cấu hình này bảo đảm mọi route khác ngoài static assets, hình ảnh, favicon mới đi qua Functions; assets nặng như `_next/static` sẽ được phục vụ trực tiếp, tránh tốn invocations không cần thiết.[^11][^14]

Một repo ví dụ cho React Router + Pages Functions yêu cầu file `functions/[[path]].ts` ở root để bắt mọi route động, cộng với `_routes.json` để exclude static assets và cấu hình Vite proxy dev phù hợp. Điều này giúp SPA của bạn render đúng route client-side trong khi vẫn cho phép bạn chèn logic server-side khi cần.[^14]

## 10. Các use case điển hình cho backend nhỏ

Docs chính thức và các bài hướng dẫn cộng đồng đều nhấn mạnh rằng Pages Functions phù hợp cho:

- API proxy: giấu API key AI (Gemini, OpenAI, OpenRouter) bằng cách để key ở environment variables và cho frontend gọi `/api/chat`, `/api/generate`, v.v.[^2][^5]
- Xử lý form: nhận POST từ form contact hoặc feedback, validate và gửi email/webhook.[^4][^2]
- Auth nhẹ: check cookie/session token trước khi trả static asset hoặc redirect sang trang login.[^2]
- Kết nối service khác của Cloudflare: D1 (database nhẹ), R2 (object storage), KV (key-value), Durable Objects.[^2][^7]

Do chạy trên edge, Functions rất nhanh và scale tự động, phù hợp với các backend “nhẹ nhưng nhiều request”, ví dụ gọi API AI, xử lý JSON, đọc/ghi DB nhẹ. Những thứ cần binary, runtime nặng hoặc xử lý file lớn thì nên chuyển sang backend khác như Render, Cloud Run, v.v.

## 11. Các lỗi phổ biến khiến AI build Pages Functions bị fail

Khi dùng AI để generate project, một số lỗi pattern rất thường gặp được phản ánh trong issues GitHub và thảo luận cộng đồng:

1. **Đặt thư mục `functions/` sai vị trí**  
   AI thường nhét `functions/` vào trong `dist/` hoặc thư mục static output khác. Cloudflare docs nói rõ `functions/` phải nằm ở root của project (source), không nằm trong static output. Nếu bạn upload riêng `dist/` lên Pages, thì `functions/` bên ngoài sẽ bị bỏ qua, dẫn tới “Pages không thể tìm thấy Functions”.[^1][^5][^3]

2. **Deploy chỉ thư mục build, không deploy cả source**  
   Khi bạn dùng workflow “AI build Vite app → lấy `dist` → upload lên Pages”, Cloudflare sẽ coi đây là site tĩnh, vì trong `dist` không có code Functions. Để dùng Pages Functions, bạn phải để Pages build từ repo có cả source lẫn `functions/`, hoặc dùng Wrangler với `pages_build_output_dir` trỏ tới `dist` nhưng project vẫn chứa `functions/` ở root.[^8][^5][^3]

3. **Sai build config: Build command / Build output directory / Root directory**  
   Nếu build output directory cấu hình sai (ví dụ ghi `/dist` thay vì `dist`) hoặc root directory không trỏ đến thư mục chứa `functions/`, Cloudflare có thể build ra output đúng nhưng bỏ qua Functions. Điều này thường thấy trong các issue khi dùng preset framework như Nuxt, Next hoặc khi chuyển từ config cũ sang mới.[^15][^9][^3]

4. **Nhầm giữa Workers, Pages, Workers Sites**  
   Một số ví dụ cũ hoặc bài blog dùng `wrangler publish` với Workers Sites; nếu AI copy pattern đó, nó có thể tạo config không tương thích với Pages Functions hiện tại. Docs mới nhấn mạnh dùng `wrangler pages` cho Pages, và `pages_build_output_dir` thay cho cấu hình static site cũ.[^4][^5][^8]

5. **Không cấu hình `_routes.json` trong app phức tạp**  
   Với app Next/React Router phức tạp, nếu không exclude đúng static assets, bạn có thể tốn nhiều invocations hoặc Functions bị gọi cho favicon, image, `_next/image`, v.v. Điều này làm bạn tưởng “backend bị lỗi” do log spam hoặc chi phí invocations tăng.[^11][^14]

## 12. Chiến lược prompt cho AI khi build project có Pages Functions

Từ các yêu cầu trong docs và các lỗi phổ biến, có thể rút ra một số guideline để viết prompt cho AI (Builder, Agents) khi muốn project chạy tốt trên Pages Functions:

- Yêu cầu rõ ràng: tạo **repo Vite/React** với cấu trúc chuẩn, trong đó `functions/` nằm ở root project (cùng cấp với `package.json`).[^5][^3]
- Chỉ định example cụ thể: tạo `functions/api/hello.ts` trả về JSON để test route `/api/hello`.[^1][^5]
- Nhắc AI không được đưa `functions/` vào `dist/` hay thư mục build nào khác; build output phải là `dist/` ở root, còn `functions/` vẫn giữ nguyên.[^3][^1]
- Gợi ý thêm `_routes.json` nếu app dùng React Router hoặc Next static export, để exclude `/assets/*`, `/_next/static/*`, `/images/*`, `/favicon.*`.[^14][^11]
- Yêu cầu chuẩn bị sẵn script `"preview": "wrangler pages dev ./dist"` trong `package.json` để dễ test local.[^9][^5]

Khi dán prompt vào AI builder, nên yêu cầu nó in ra **cây thư mục** rõ ràng (file tree) để bạn kiểm tra nhanh xem `functions/` đã nằm đúng chỗ hay chưa.

## 13. Khi nào nên dùng Pages Functions, khi nào cần backend khác

Pages Functions rất mạnh cho các backend “nhỏ nhưng nhiều request” và logic không quá nặng:

- Web AI front-end cần proxy gọi API LLM, giấu key, xử lý stream kết quả.[^5][^2]
- Form, contact, feedback, tracking, lightweight analytics.[^4][^2]
- Auth cơ bản, check header/cookie, redirect.[^2]
- CRUD nhẹ với D1/KV và file nhỏ với R2.[^2][^7]

Tuy nhiên, khi bạn cần:

- Chạy binary nặng (ví dụ Pandoc, FFmpeg, xử lý video lớn, machine learning custom).
- Xử lý file rất lớn, upload/download khổng lồ, pipeline phức tạp.
- Runtime kiểu server truyền thống với long-running process.

thì nên dùng backend riêng như Render, Cloud Run, Fly.io hoặc server/VPS, và giữ Pages Functions cho các nhiệm vụ edge nhẹ, auth, routing, proxy.[^9][^4]

## 14. Checklist nhanh để kiểm tra project Pages Functions

Dựa trên docs và kinh nghiệm cộng đồng, có thể lập một checklist để debug nhanh khi Pages Functions “không chạy”:

- Repo Git có thư mục `functions/` ở root chưa? (Không nằm trong `dist/` hay subfolder framework.)[^1][^5]
- Build command và build output directory trong dashboard đã đúng với framework? (Ví dụ Vite: `npm run build` + `dist`.)[^3]
- Root directory trong config có trỏ tới nơi chứa `functions/`, `src`, `package.json` không?[^13][^3]
- Bạn deploy từ repo (connect Git) hay chỉ upload dist? Nếu chỉ upload dist, bạn sẽ không có Functions.[^5][^1]
- Nếu dùng Wrangler, đã cấu hình `pages_build_output_dir` và chạy `wrangler pages dev ./dist` để test local chưa?[^8][^5]
- App SPA phức tạp có cần `_routes.json` để exclude static assets và tránh tốn invocations không?[^11][^14]
- Compatibility date/flags trong Settings > Functions đã phù hợp với runtime (ví dụ cần `nodejs_compat` nếu code dùng Node API)?[^1][^5]

Nếu pass hết checklist này, gần như chắc Pages Functions sẽ hoạt động ổn định cho backend nhỏ đi kèm site trên Cloudflare Pages.

---

## References

1. [Functions - Get started · Cloudflare Pages docs](https://developers.cloudflare.com/pages/functions/get-started/) - Create and deploy your first Pages Function on Cloudflare Pages.

2. [Functions](https://developers.cloudflare.com/pages/functions/) - Build full-stack applications on Cloudflare Pages using Pages Functions.

3. [Build configuration · Cloudflare Pages docs](https://developers.cloudflare.com/pages/configuration/build-configuration/) - Build directories indicates where your project's build command outputs the built version of your Clo...

4. [Overview](https://developers.cloudflare.com/pages/) - Deploy full-stack applications instantly to the Cloudflare global network with Pages.

5. [Cloudflare Pages - know.2nth.ai](https://know.2nth.ai/explainers/tech/cloudflare/pages) - Git-driven static hosting with edge Functions. Connect a repo, get a global deploy with preview URLs...

6. [Cloudflare pages routes - tkdn](https://scrapbox.io/tkdn/Cloudflare_pages_routes) - Routing · Cloudflare Pages docs https://developers.cloudflare.com/pages/platform/functions/routing/#...

7. [API reference · Cloudflare Pages docs](https://developers.cloudflare.com/pages/functions/api-reference/) - Learn about the APIs used within Pages Functions.

8. [Cloudflare Pages - Cloudflare Workers SDK - Mintlify](https://www.mintlify.com/cloudflare/workers-sdk/platform/pages) - Deploy static sites and full-stack applications with Cloudflare Pages

9. [Complete Guide to Deploying on Cloudflare Pages](https://rgcs.ca/blog/cloudflare-pages-deployment-guide/) - Learn how to deploy your web applications on Cloudflare Pages with CI/CD, custom domains, and edge f...

10. [DNS - SGOL Post](https://sgol.pub/how_to_deploy_to_cloudflair_pages)

11. [Cloudflare Page Function Invocation Routes - Reddit](https://www.reddit.com/r/CloudFlare/comments/1deq86w/cloudflare_page_function_invocation_routes/) - Recently, I uploaded a demo app on cloudflare to check how it handles traffic. It has just 1-2 page ...

12. [GitHub - ryanjaeb/cloudflare-pages-routing](https://github.com/ryanjaeb/cloudflare-pages-routing) - Contribute to ryanjaeb/cloudflare-pages-routing development by creating an account on GitHub.

13. [Getting started · Cloudflare Pages docs](https://developers.cloudflare.com/pages/get-started/) - Choose a setup method to create and deploy your Cloudflare Pages project.

14. [react router and cloudflare pages #12667 - GitHub](https://github.com/remix-run/react-router/discussions/12667) - Set up your routes in _routes.json . Example: { "version": Some of the examples add /build/* to the ...

15. [🐛 BUG: pages deploy "found" /functions directory when no such directory exists · Issue #2804 · cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk/issues/2804) - Which Cloudflare product(s) does this pertain to? Pages What version of Wrangler are you using? 2.0....

