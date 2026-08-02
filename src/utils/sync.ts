import { createClient } from "webdav";
import { db } from "./db";
import { parseMarkdown } from "./markdown";

export async function syncWithWebDAV(url: string, user: string, pass: string, filename: string) {
  // 注意：浏览器环境下直接访问 WebDAV 服务器可能会遇到跨域 (CORS) 限制。
  // 请确保您的 WebDAV 服务（如 Nextcloud）开启了 CORS，
  // 或者使用支持 CORS 的代理。
  const client = createClient(url, {
    username: user,
    password: pass
  });

  try {
    const fileContent = await client.getFileContents(filename, { format: "text" });
    const markdown = typeof fileContent === 'string' ? fileContent : fileContent.toString();
    const newCards = parseMarkdown(markdown);
    
    if (newCards.length > 0) {
      await db.addCards(newCards);
      return { success: true, message: `成功同步 ${newCards.length} 个知识点！` };
    }
    return { success: false, message: "文件解析失败，未找到有效知识点。" };
  } catch (err: any) {
    return { success: false, message: "同步失败，请检查配置或跨域限制。" };
  }
}
