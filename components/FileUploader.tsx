'use client'

import { useState, useRef, useEffect } from 'react'
import { JournalEntry } from '@/types'
import { parseSRT } from '@/utils/srtParser'
import { 
  saveFile, 
  getAllFilePairs, 
  deleteFilePair, 
  generatePairId,
  FilePair as StoredFilePair 
} from '@/utils/fileStorage'
import {
  uploadFileToCloud,
  saveFilePairToCloud,
  getAllFilePairsFromCloud,
  downloadFileFromCloud,
  deleteFilePairFromCloud,
  type CloudFilePair
} from '@/utils/cloudStorage'
import { isCloudSyncEnabled } from '@/lib/supabase'

interface FileUploaderProps {
  onAudioLoad: (audioUrl: string, fileName: string) => void
  onSubtitleLoad: (data: JournalEntry[]) => void
  refreshTrigger?: number // 新增：刷新触发器
}

interface FilePair {
  id?: string
  audio: File | null
  subtitle: File | null
  name: string
  uploadedAt?: number
}

export default function FileUploader({ onAudioLoad, onSubtitleLoad, refreshTrigger = 0 }: FileUploaderProps) {
  const [filePairs, setFilePairs] = useState<FilePair[]>([])
  const [storedPairs, setStoredPairs] = useState<StoredFilePair[]>([])
  const [cloudPairs, setCloudPairs] = useState<CloudFilePair[]>([])
  const [selectedPair, setSelectedPair] = useState<FilePair | null>(null)
  const [selectedStoredPair, setSelectedStoredPair] = useState<StoredFilePair | null>(null)
  const [selectedCloudPair, setSelectedCloudPair] = useState<CloudFilePair | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCloudEnabled, setIsCloudEnabled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 检查云端同步是否启用
  useEffect(() => {
    setIsCloudEnabled(isCloudSyncEnabled())
  }, [])

  // 页面加载时或触发器更新时从本地和云端读取已保存的文件
  useEffect(() => {
    loadStoredFiles()
  }, [refreshTrigger, isCloudEnabled]) // 监听 refreshTrigger

  const loadStoredFiles = async () => {
    try {
      setIsLoading(true)
      
      // 从本地加载
      const localPairs = await getAllFilePairs()
      setStoredPairs(localPairs)
      
      // 从云端加载（如果启用）
      if (isCloudEnabled) {
        const cloudPairsData = await getAllFilePairsFromCloud()
        setCloudPairs(cloudPairsData)
      }
    } catch (error) {
      console.error('加载已保存文件失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取文件的基础名称（不含扩展名）
  const getBaseName = (fileName: string): string => {
    const lastDot = fileName.lastIndexOf('.')
    return lastDot > 0 ? fileName.substring(0, lastDot) : fileName
  }

  // 检查是否为音频文件
  const isAudioFile = (file: File): boolean => {
    return file.type.startsWith('audio/') || 
           /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name)
  }

  // 检查是否为字幕文件
  const isSubtitleFile = (file: File): boolean => {
    return /\.(srt|json)$/i.test(file.name)
  }

  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target?.files || [])
    if (files.length === 0) return

    // 按基础名称分组文件
    const pairsMap = new Map<string, FilePair>()

    files.forEach(file => {
      const baseName = getBaseName(file.name)
      
      if (!pairsMap.has(baseName)) {
        const pairId = generatePairId()
        pairsMap.set(baseName, {
          id: pairId,
          audio: null,
          subtitle: null,
          name: baseName,
          uploadedAt: Date.now(),
        })
      }

      const pair = pairsMap.get(baseName)!
      
      if (isAudioFile(file)) {
        pair.audio = file
      } else if (isSubtitleFile(file)) {
        pair.subtitle = file
      }
    })

    // 转换为数组
    const newPairs = Array.from(pairsMap.values())
    
    // 保存到本地 IndexedDB
    for (const pair of newPairs) {
      if (pair.audio && pair.id) {
        await saveFile(pair.audio, pair.id, 'audio')
      }
      if (pair.subtitle && pair.id) {
        await saveFile(pair.subtitle, pair.id, 'subtitle')
      }
    }

    // 上传到云端（如果启用）
    if (isCloudEnabled) {
      for (const pair of newPairs) {
        if (pair.id) {
          let audioUrl: string | null = null
          let subtitleUrl: string | null = null
          
          if (pair.audio) {
            audioUrl = await uploadFileToCloud(pair.audio, pair.id, 'audio')
          }
          if (pair.subtitle) {
            subtitleUrl = await uploadFileToCloud(pair.subtitle, pair.id, 'subtitle')
          }
          
          await saveFilePairToCloud(
            pair.id,
            pair.name,
            audioUrl,
            subtitleUrl,
            pair.audio?.name || null,
            pair.subtitle?.name || null
          )
        }
      }
    }

    // 更新状态
    setFilePairs(newPairs)
    
    // 重新加载已保存的文件列表
    await loadStoredFiles()

    // 如果有文件对，自动选择第一个有音频的
    const firstWithAudio = newPairs.find(pair => pair.audio)
    if (firstWithAudio) {
      handleSelectPair(firstWithAudio)
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 选择新上传的文件对并加载
  const handleSelectPair = async (pair: FilePair) => {
    if (!pair.audio) {
      alert('该文件对没有音频文件')
      return
    }

    setSelectedPair(pair)
    setSelectedStoredPair(null)

    // 加载音频文件
    const audioUrl = URL.createObjectURL(pair.audio)
    onAudioLoad(audioUrl, pair.audio.name)

    // 如果有匹配的字幕文件，自动加载
    if (pair.subtitle) {
      await loadSubtitle(pair.subtitle)
    } else {
      onSubtitleLoad([])
    }
  }

  // 选择已保存的文件对并加载（本地）
  const handleSelectStoredPair = async (pair: StoredFilePair) => {
    if (!pair.audio) {
      alert('该文件对没有音频文件')
      return
    }

    setSelectedStoredPair(pair)
    setSelectedPair(null)
    setSelectedCloudPair(null)

    // 加载音频文件
    const audioUrl = URL.createObjectURL(pair.audio.file)
    onAudioLoad(audioUrl, pair.audio.name)

    // 如果有匹配的字幕文件，自动加载
    if (pair.subtitle) {
      await loadSubtitle(pair.subtitle.file)
    } else {
      onSubtitleLoad([])
    }
  }

  // 选择云端文件对并加载
  const handleSelectCloudPair = async (pair: CloudFilePair) => {
    if (!pair.audioUrl) {
      alert('该文件对没有音频文件')
      return
    }

    setSelectedCloudPair(pair)
    setSelectedPair(null)
    setSelectedStoredPair(null)

    // 从云端下载并加载音频文件
    const audioFile = await downloadFileFromCloud(pair.audioUrl)
    if (audioFile) {
      const audioUrl = URL.createObjectURL(audioFile)
      onAudioLoad(audioUrl, pair.audioFileName || 'audio')
    } else {
      alert('下载音频文件失败')
      return
    }

    // 如果有匹配的字幕文件，自动加载
    if (pair.subtitleUrl) {
      const subtitleFile = await downloadFileFromCloud(pair.subtitleUrl)
      if (subtitleFile) {
        await loadSubtitle(subtitleFile)
      }
    } else {
      onSubtitleLoad([])
    }
  }

  // 加载字幕文件
  const loadSubtitle = async (subtitleFile: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        let data: JournalEntry[]

        if (subtitleFile.name.toLowerCase().endsWith('.srt')) {
          data = parseSRT(text)
          if (data.length === 0) {
            throw new Error('SRT 文件为空或格式不正确')
          }
        } else {
          data = JSON.parse(text) as JournalEntry[]
          if (!Array.isArray(data)) {
            throw new Error('字幕数据必须是数组格式')
          }
          data.forEach((entry, index) => {
            if (!entry.id || typeof entry.startTime !== 'number' || 
                typeof entry.endTime !== 'number' || !entry.englishText || !entry.chineseText) {
              throw new Error(`条目 ${index + 1} 格式不正确`)
            }
          })
        }

        onSubtitleLoad(data)
      } catch (error) {
        console.error('读取字幕文件失败:', error)
        alert(`读取字幕文件失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
    reader.onerror = () => {
      alert('读取字幕文件时出错')
    }
    reader.readAsText(subtitleFile, 'utf-8')
  }

  // 删除已保存的文件对（本地）
  const handleDeleteStoredPair = async (pairId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('确定要删除这个文件吗？')) {
      return
    }

    try {
      await deleteFilePair(pairId)
      
      // 如果启用了云端同步，也删除云端文件
      if (isCloudEnabled) {
        await deleteFilePairFromCloud(pairId)
      }
      
      await loadStoredFiles()
      
      // 如果删除的是当前选中的文件，清空选择
      if (selectedStoredPair?.id === pairId || selectedCloudPair?.id === pairId) {
        setSelectedStoredPair(null)
        setSelectedCloudPair(null)
        onAudioLoad('', '')
        onSubtitleLoad([])
      }
    } catch (error) {
      console.error('删除文件失败:', error)
      alert('删除文件失败')
    }
  }

  // 删除云端文件对
  const handleDeleteCloudPair = async (pairId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('确定要删除这个文件吗？')) {
      return
    }

    try {
      await deleteFilePairFromCloud(pairId)
      await loadStoredFiles()
      
      // 如果删除的是当前选中的文件，清空选择
      if (selectedCloudPair?.id === pairId) {
        setSelectedCloudPair(null)
        onAudioLoad('', '')
        onSubtitleLoad([])
      }
    } catch (error) {
      console.error('删除文件失败:', error)
      alert('删除文件失败')
    }
  }

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return '今天'
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 mb-6 shadow-2xl">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">文件管理</h2>
      
      <div className="space-y-6">
        {/* 上传新文件 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            上传新文件
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.srt,.json"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
          >
            选择文件（可多选）
          </button>
          <p className="text-xs text-gray-500 mt-2">
            支持同时选择音频文件（MP3, WAV 等）和字幕文件（SRT, JSON）
            <br />
            系统会自动匹配同名文件并保存，下次访问时仍可使用
          </p>
        </div>

        {/* 云端同步状态 */}
        {isCloudEnabled && (
          <div className="p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>云端同步已启用 - 文件将在所有设备间同步</span>
            </div>
          </div>
        )}

        {/* 已保存的文件列表 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            已保存的文件
            {isLoading && <span className="ml-2 text-xs text-gray-500">(加载中...)</span>}
            {isCloudEnabled && cloudPairs.length > 0 && (
              <span className="ml-2 text-xs text-green-400">({cloudPairs.length} 个云端文件)</span>
            )}
          </label>
          
          {storedPairs.length === 0 && cloudPairs.length === 0 && !isLoading ? (
            <div className="p-4 bg-gray-700/30 rounded-lg text-center text-gray-400 text-sm">
              还没有保存的文件
              <br />
              <span className="text-xs text-gray-500">上传文件后会自动保存</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* 云端文件列表 */}
              {isCloudEnabled && cloudPairs.map((pair) => {
                const isSelected = selectedCloudPair?.id === pair.id
                const hasAudio = pair.audioUrl !== null
                const hasSubtitle = pair.subtitleUrl !== null

                return (
                  <div
                    key={`cloud-${pair.id}`}
                    onClick={() => handleSelectCloudPair(pair)}
                    className={`p-3 rounded-lg transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-gray-700/50 border-transparent hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-gray-200">
                            {pair.name}
                          </div>
                          <span className="text-xs text-green-400">☁️ 云端</span>
                          {pair.uploadedAt && (
                            <span className="text-xs text-gray-500">
                              {formatDate(pair.uploadedAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {hasAudio ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0013 13c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                              </svg>
                              {pair.audioFileName}
                            </span>
                          ) : (
                            <span className="text-gray-600">无音频文件</span>
                          )}
                          {hasSubtitle ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                              {pair.subtitleFileName}
                            </span>
                          ) : (
                            <span className="text-gray-600">无字幕文件</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <button
                          onClick={(e) => handleDeleteCloudPair(pair.id, e)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="删除文件"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* 本地文件列表 */}
              {storedPairs.map((pair) => {
                const isSelected = selectedStoredPair?.id === pair.id
                const hasAudio = pair.audio !== null
                const hasSubtitle = pair.subtitle !== null

                return (
                  <div
                    key={pair.id}
                    onClick={() => handleSelectStoredPair(pair)}
                    className={`p-3 rounded-lg transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-gray-700/50 border-transparent hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-gray-200">
                            {pair.name}
                          </div>
                          {pair.uploadedAt && (
                            <span className="text-xs text-gray-500">
                              {formatDate(pair.uploadedAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {hasAudio ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0013 13c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                              </svg>
                              {pair.audio!.name}
                            </span>
                          ) : (
                            <span className="text-gray-600">无音频文件</span>
                          )}
                          {hasSubtitle ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                              {pair.subtitle!.name}
                            </span>
                          ) : (
                            <span className="text-gray-600">无字幕文件</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <button
                          onClick={(e) => handleDeleteStoredPair(pair.id, e)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="删除文件"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 示例字幕格式说明 */}
      <details className="mt-4">
        <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
          查看字幕文件格式示例
        </summary>
        <div className="mt-2 space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">SRT 格式（推荐）：</p>
            <pre className="p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
{`1
00:00:00,000 --> 00:00:03,500
Hello, welcome to today's listening practice.
你好，欢迎来到今天的听力练习。`}
            </pre>
          </div>
        </div>
      </details>
    </div>
  )
}
