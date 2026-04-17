/**
 * 前端 fetch 時用這個函式包 URL，自動帶上子路徑。
 *
 * 例如：
 *   apiUrl("/api/report") → "/original-face/api/report"
 *
 * 若沒設 basePath，直接回傳原路徑。
 */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!path.startsWith("/")) path = "/" + path;
  return base + path;
}
