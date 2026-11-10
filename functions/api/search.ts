import { getSessionUserId } from "../lib/auth";
import { error, json, readJson } from "../lib/http";
import type { Env } from "../lib/env";
import {
  SearchProviderError,
  getSearchProviderNames,
  runSearch,
  sanitizeSearchRequest,
} from "../lib/search";

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!(await getSessionUserId(request, env))) {
    return error("Vui lòng đăng nhập để tìm kiếm.", 401);
  }

  if (!getSearchProviderNames(env).length) {
    return error("Dịch vụ tìm kiếm chưa được cấu hình.", 503);
  }

  const body = await readJson(request);
  const searchRequest = sanitizeSearchRequest(body);
  if (!searchRequest) return error("Truy vấn tìm kiếm không hợp lệ.");

  try {
    const outcome = await runSearch(env, searchRequest);
    return json(
      {
        status: "success",
        ok: true,
        data: {
          requestId: outcome.requestId,
          searchType: outcome.searchType,
          provider: outcome.provider,
          attempts: outcome.attempts,
          results: outcome.results,
          output: outcome.output,
        },
      },
      200,
      {
        "cache-control": "no-store",
        "x-smarm-search-provider": outcome.provider,
        "x-smarm-search-type": outcome.searchType,
        "x-smarm-search-fallbacks": String(outcome.attempts.length),
      },
    );
  } catch (err) {
    if (err instanceof SearchProviderError) {
      console.error("Search failed", err.attempts);
      return error(err.message, err.status);
    }
    console.error("Search crashed", err);
    return error("Dịch vụ tìm kiếm gặp lỗi không xác định.", 502);
  }
}
