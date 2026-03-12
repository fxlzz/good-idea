let _uploadLimitBytes: number | null = null

export async function getUploadLimitBytes(): Promise<number> {
  if (_uploadLimitBytes !== null) return _uploadLimitBytes
  try {
    const res = await fetch('/api/config/upload-limit')
    if (res.ok) {
      const data = await res.json()
      _uploadLimitBytes = data.bytes ?? 10 * 1024 * 1024
      return _uploadLimitBytes
    }
  } catch {
    /* fallback */
  }
  _uploadLimitBytes = 10 * 1024 * 1024
  return _uploadLimitBytes
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${bytes}B`
}
