/** 系统支持的文件扩展名 */
export const ALLOWED_FILE_EXTENSIONS = [".md", ".pdf", ".xlsx", ".docx", ".txt"] as const;

export function getExtension(name: string): string {
  if (!name || !name.includes(".")) return "";
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return ext;
}

export function isAllowedExtension(ext: string): boolean {
  return ALLOWED_FILE_EXTENSIONS.includes(ext as (typeof ALLOWED_FILE_EXTENSIONS)[number]);
}

/** 若文件名无扩展名则补全 .md */
export function ensureFileExtension(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (!trimmed.includes(".")) return `${trimmed}.md`;
  return trimmed;
}

export const UNSUPPORTED_FILE_TYPE_MSG = "系统仅支持以下格式：.md、.pdf、.xlsx、.docx、.txt";
