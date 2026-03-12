import { message } from 'antd'
import { useCallback, useRef } from 'react'
import { useFileTreeStore } from '../store/fileTree'
import { getExtension, isAllowedExtension, UNSUPPORTED_FILE_TYPE_MSG } from '../utils/fileTypes'
import { formatBytes, getUploadLimitBytes } from '../utils/upload'

function generateId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 上传文件到指定父节点（文件夹或根 null）。
 * 返回 triggerUpload（触发文件选择）和用于 <input type="file" /> 的 ref + onChange。
 */
export function useUploadFile(parentId: string | null) {
  const addNode = useFileTreeStore((s) => s.addNode)
  const setExpanded = useFileTreeStore((s) => s.setExpanded)
  const inputRef = useRef<HTMLInputElement>(null)

  const triggerUpload = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const ext = getExtension(file.name)
      if (!isAllowedExtension(ext)) {
        message.error(UNSUPPORTED_FILE_TYPE_MSG)
        e.target.value = ''
        return
      }

      const limitBytes = await getUploadLimitBytes()
      const estimatedBodySize = file.size * 1.4
      if (estimatedBodySize > limitBytes) {
        message.error(
          `文件 "${file.name}" 大小为 ${formatBytes(file.size)}，超过上传限制 ${formatBytes(limitBytes)}，请选择更小的文件`,
        )
        e.target.value = ''
        return
      }

      const reader = new FileReader()

      reader.onload = () => {
        let content: string | null = null

        if (ext === '.md' || ext === '.txt' || !ext) {
          content = typeof reader.result === 'string' ? reader.result : ''
        } else {
          const result = typeof reader.result === 'string' ? reader.result : ''
          const base64 = result.startsWith('data:') ? result.split(',')[1] ?? '' : result
          content = base64
        }

        addNode({
          id: generateId(),
          name: file.name,
          type: 'file',
          parentId,
          content: content ?? '',
        })
        if (parentId !== null) {
          setExpanded(parentId, true)
        }
      }

      if (ext === '.md' || ext === '.txt' || !ext) {
        reader.readAsText(file)
      } else {
        reader.readAsDataURL(file)
      }
      e.target.value = ''
    },
    [parentId, addNode, setExpanded],
  )

  return { inputRef, triggerUpload, handleFileChange }
}
