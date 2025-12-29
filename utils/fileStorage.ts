/**
 * 文件存储工具
 * 使用 IndexedDB 存储文件，支持持久化
 */

interface StoredFile {
  id: string
  name: string
  type: 'audio' | 'subtitle'
  file: File
  uploadedAt: number
}

export interface FilePair {
  id: string
  name: string
  audio: StoredFile | null
  subtitle: StoredFile | null
  uploadedAt: number
}

const DB_NAME = 'ListeningPlayerDB'
const DB_VERSION = 1
const STORE_NAME = 'files'

// 打开数据库
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

// 将 File 对象转换为可存储的格式
async function fileToStorable(file: File): Promise<{ name: string; type: string; data: ArrayBuffer; size: number }> {
  const arrayBuffer = await file.arrayBuffer()
  return {
    name: file.name,
    type: file.type || 'application/octet-stream',
    data: arrayBuffer,
    size: file.size,
  }
}

// 保存文件
export async function saveFile(file: File, pairId: string, type: 'audio' | 'subtitle'): Promise<void> {
  const db = await openDB()
  const storable = await fileToStorable(file)
  
  const storedFile: StoredFile = {
    id: `${pairId}-${type}`,
    name: file.name,
    type,
    file: file, // 注意：实际存储时会序列化，这里保留引用用于当前会话
    uploadedAt: Date.now(),
  }

  // 存储到 IndexedDB
  const transaction = db.transaction([STORE_NAME], 'readwrite')
  const store = transaction.objectStore(STORE_NAME)
  
  // 存储文件数据
  await new Promise<void>((resolve, reject) => {
    const request = store.put({
      id: storedFile.id,
      name: storedFile.name,
      type: storedFile.type,
      data: storable.data,
      mimeType: storable.type,
      uploadedAt: storedFile.uploadedAt,
    })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })

  db.close()
}

// 获取文件
export async function getFile(fileId: string): Promise<File | null> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], 'readonly')
  const store = transaction.objectStore(STORE_NAME)
  
  return new Promise((resolve, reject) => {
    const request = store.get(fileId)
    request.onsuccess = () => {
      const result = request.result
      if (result) {
        const file = new File([result.data], result.name, { type: result.mimeType })
        resolve(file)
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// 获取所有文件对
export async function getAllFilePairs(): Promise<FilePair[]> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], 'readonly')
  const store = transaction.objectStore(STORE_NAME)
  
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => {
      const allFiles = request.result as Array<{
        id: string
        name: string
        type: 'audio' | 'subtitle'
        data: ArrayBuffer
        mimeType: string
        uploadedAt: number
      }>

      // 按基础名称分组
      const pairsMap = new Map<string, FilePair>()

      allFiles.forEach((stored) => {
        // 从 ID 中提取 pairId（格式：pairId-audio 或 pairId-subtitle）
        const parts = stored.id.split('-')
        if (parts.length < 2) return
        
        const pairId = parts.slice(0, -1).join('-') // 处理可能包含多个 '-' 的情况
        const baseName = stored.name.replace(/\.[^/.]+$/, '')

        if (!pairsMap.has(pairId)) {
          pairsMap.set(pairId, {
            id: pairId,
            name: baseName,
            audio: null,
            subtitle: null,
            uploadedAt: stored.uploadedAt,
          })
        }

        const pair = pairsMap.get(pairId)!
        const file = new File([stored.data], stored.name, { type: stored.mimeType || 'application/octet-stream' })
        
        if (stored.type === 'audio') {
          pair.audio = {
            id: stored.id,
            name: stored.name,
            type: 'audio',
            file,
            uploadedAt: stored.uploadedAt,
          }
        } else if (stored.type === 'subtitle') {
          pair.subtitle = {
            id: stored.id,
            name: stored.name,
            type: 'subtitle',
            file,
            uploadedAt: stored.uploadedAt,
          }
        }

        // 更新上传时间（取最新的）
        if (stored.uploadedAt > pair.uploadedAt) {
          pair.uploadedAt = stored.uploadedAt
        }
      })

      const pairs = Array.from(pairsMap.values())
      // 按上传时间倒序排列
      pairs.sort((a, b) => b.uploadedAt - a.uploadedAt)
      resolve(pairs)
    }
    request.onerror = () => reject(request.error)
  })
}

// 删除文件对
export async function deleteFilePair(pairId: string): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], 'readwrite')
  const store = transaction.objectStore(STORE_NAME)
  
  // 删除音频和字幕文件
  const audioId = `${pairId}-audio`
  const subtitleId = `${pairId}-subtitle`
  
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const request = store.delete(audioId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    }),
    new Promise<void>((resolve, reject) => {
      const request = store.delete(subtitleId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    }),
  ])

  db.close()
}

// 生成唯一 ID
export function generatePairId(): string {
  return `pair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

