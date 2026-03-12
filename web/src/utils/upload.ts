let _uploadLimitBytes: number | undefined

export async function getUploadLimitBytes(): Promise<number> {
  if (_uploadLimitBytes !== undefined) return _uploadLimitBytes
  try {
    const res = await fetch('/api/config/upload-limit')
    if (res.ok) {
      const data = await res.json()
      const bytes = (data.bytes as number | undefined) ?? 10 * 1024 * 1024
      _uploadLimitBytes = bytes
      return bytes
    }
  } catch {
    /* fallback */
  }
  const fallback = 10 * 1024 * 1024
  _uploadLimitBytes = fallback
  return fallback
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${bytes}B`
}
