'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { JournalEntry, DisplayMode } from '@/types'
import { compareText, type WordComparison } from '@/utils/textComparison'

interface ListeningPlayerProps {
  journalData: JournalEntry[]
  audioUrl: string
}

const PLAYBACK_SPEEDS = [0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 2.0]
const DISPLAY_MODES: DisplayMode[] = ['english', 'bilingual', 'hidden']

export default function ListeningPlayer({ journalData, audioUrl }: ListeningPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('bilingual')
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [loopEntryId, setLoopEntryId] = useState<string | null>(null)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [dictationInputs, setDictationInputs] = useState<Record<string, string>>({})
  const [dictationResults, setDictationResults] = useState<Record<string, WordComparison[]>>({})

  // 当音频URL变化时，重置状态
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.load()
    setCurrentTime(0)
    setIsPlaying(false)
    setActiveEntryId(null)
    setAudioError(null)

    const handleError = () => {
      setAudioError('无法加载音频文件，请检查文件格式是否正确')
      setIsPlaying(false)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setAudioError(null)
    }

    audio.addEventListener('error', handleError)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [audioUrl])

  // 更新当前激活的字幕条目
  const updateActiveEntry = () => {
    const current = audioRef.current?.currentTime || 0
    const active = journalData.find(
      (entry) => current >= entry.startTime && current < entry.endTime
    )
    setActiveEntryId(active?.id || null)
  }

  // 更新当前时间
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
      updateActiveEntry()
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
    })

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
    }
  }, [journalData])

  // 更新播放速度
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  // 处理循环播放
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !loopEntryId) return

    const entry = journalData.find((e) => e.id === loopEntryId)
    if (!entry) return

    const checkLoop = () => {
      if (audio.currentTime >= entry.endTime) {
        audio.currentTime = entry.startTime
        if (!isPlaying) {
          audio.play()
          setIsPlaying(true)
        }
      }
    }

    const interval = setInterval(checkLoop, 100)
    return () => clearInterval(interval)
  }, [loopEntryId, journalData, isPlaying])

  // 播放/暂停
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  // 跳转到指定时间
  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = time
    if (!isPlaying) {
      audio.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  // 点击字幕块跳转
  const handleEntryClick = (entry: JournalEntry) => {
    seekTo(entry.startTime)
  }

  // 切换单句循环
  const toggleLoop = (entryId: string) => {
    if (loopEntryId === entryId) {
      setLoopEntryId(null)
    } else {
      setLoopEntryId(entryId)
    }
  }

  // 切换显示模式
  const cycleDisplayMode = () => {
    const currentIndex = DISPLAY_MODES.indexOf(displayMode)
    const nextIndex = (currentIndex + 1) % DISPLAY_MODES.length
    setDisplayMode(DISPLAY_MODES[nextIndex])
    
    // 如果切换到非 Hidden 模式，清空听写结果
    if (DISPLAY_MODES[nextIndex] !== 'hidden') {
      setDictationInputs({})
      setDictationResults({})
    }
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 进度条点击
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    seekTo(newTime)
  }

  // 跳转到下一句并开启循环
  const goToNextSentence = useCallback(() => {
    if (journalData.length === 0) return

    let currentIndex = -1
    
    // 如果有正在循环的句子，找到它的索引
    if (loopEntryId) {
      currentIndex = journalData.findIndex(entry => entry.id === loopEntryId)
    } else if (activeEntryId) {
      // 否则使用当前激活的句子
      currentIndex = journalData.findIndex(entry => entry.id === activeEntryId)
    } else {
      // 如果都没有，使用当前播放时间找到对应的句子
      const current = audioRef.current?.currentTime || 0
      currentIndex = journalData.findIndex(
        entry => current >= entry.startTime && current < entry.endTime
      )
    }

    // 找到下一句
    const nextIndex = currentIndex < journalData.length - 1 ? currentIndex + 1 : 0
    const nextEntry = journalData[nextIndex]
    
    if (nextEntry) {
      seekTo(nextEntry.startTime)
      setLoopEntryId(nextEntry.id) // 自动开启循环
    }
  }, [journalData, loopEntryId, activeEntryId, seekTo])

  // 跳转到上一句并开启循环
  const goToPreviousSentence = useCallback(() => {
    if (journalData.length === 0) return

    let currentIndex = -1
    
    // 如果有正在循环的句子，找到它的索引
    if (loopEntryId) {
      currentIndex = journalData.findIndex(entry => entry.id === loopEntryId)
    } else if (activeEntryId) {
      // 否则使用当前激活的句子
      currentIndex = journalData.findIndex(entry => entry.id === activeEntryId)
    } else {
      // 如果都没有，使用当前播放时间找到对应的句子
      const current = audioRef.current?.currentTime || 0
      currentIndex = journalData.findIndex(
        entry => current >= entry.startTime && current < entry.endTime
      )
    }

    // 找到上一句
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : journalData.length - 1
    const prevEntry = journalData[prevIndex]
    
    if (prevEntry) {
      seekTo(prevEntry.startTime)
      setLoopEntryId(prevEntry.id) // 自动开启循环
    }
  }, [journalData, loopEntryId, activeEntryId, seekTo])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果用户正在输入（如在输入框中），不处理快捷键
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return
      }

      // 空格键：播放/暂停
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlayPause()
        return
      }

      // 右箭头或 N 键：下一句
      if (e.code === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        e.preventDefault()
        goToNextSentence()
        return
      }

      // 左箭头或 P 键：上一句
      if (e.code === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        e.preventDefault()
        goToPreviousSentence()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [togglePlayPause, goToNextSentence, goToPreviousSentence])

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
      {/* 音频元素 */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* 错误提示 */}
      {audioError && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-300 text-sm">
          {audioError}
        </div>
      )}

      {/* 快捷键提示 */}
      <div className="mb-4 p-3 bg-gray-700/50 rounded-lg text-xs text-gray-400">
        <div className="flex flex-wrap gap-4">
          <span><kbd className="px-2 py-1 bg-gray-600 rounded">空格</kbd> 播放/暂停</span>
          <span><kbd className="px-2 py-1 bg-gray-600 rounded">→</kbd> 或 <kbd className="px-2 py-1 bg-gray-600 rounded">N</kbd> 下一句循环</span>
          <span><kbd className="px-2 py-1 bg-gray-600 rounded">←</kbd> 或 <kbd className="px-2 py-1 bg-gray-600 rounded">P</kbd> 上一句循环</span>
        </div>
      </div>

      {/* 控制栏 */}
      <div className="mb-6">
        {/* 播放/暂停按钮 */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
          </button>

          {/* 时间显示 */}
          <div className="text-sm text-gray-400 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* 倍速选择器 */}
          <div className="relative ml-auto">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-200 transition-colors"
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <div className="absolute top-full mt-2 right-0 bg-gray-700 rounded-lg shadow-xl overflow-hidden z-10 min-w-[120px]">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPlaybackRate(speed)
                      setShowSpeedMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      playbackRate === speed
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-200 hover:bg-gray-600'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 字幕模式切换 */}
          <button
            onClick={cycleDisplayMode}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-200 transition-colors capitalize"
          >
            {displayMode === 'english' && 'English'}
            {displayMode === 'bilingual' && 'Bilingual'}
            {displayMode === 'hidden' && 'Hidden'}
          </button>
        </div>

        {/* 进度条 */}
        <div
          onClick={handleProgressClick}
          className="w-full h-2 bg-gray-700 rounded-full cursor-pointer relative"
        >
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </div>

      {/* 字幕区域 */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {journalData.length > 0 ? (
          journalData.map((entry) => {
            const isActive = activeEntryId === entry.id
            const isLooping = loopEntryId === entry.id

            return (
              <div
                key={entry.id}
                className={`p-4 rounded-lg transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-blue-900/30 border-blue-500 shadow-lg'
                    : 'bg-gray-700/50 border-transparent hover:bg-gray-700'
                }`}
                onClick={() => handleEntryClick(entry)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {/* 英文文本 */}
                    {displayMode === 'english' && (
                      <div className="text-base mb-2 font-sans text-gray-100">
                        {entry.englishText}
                      </div>
                    )}

                    {displayMode === 'bilingual' && (
                      <>
                        <div className="text-base mb-2 font-sans text-gray-100">
                          {entry.englishText}
                        </div>
                        <div className="text-sm chinese-text text-gray-400">
                          {entry.chineseText}
                        </div>
                      </>
                    )}

                    {/* Hidden 模式：显示听写输入框 */}
                    {displayMode === 'hidden' && (
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        {/* 听写输入框 */}
                        <div>
                          <input
                            type="text"
                            value={dictationInputs[entry.id] || ''}
                            onChange={(e) => {
                              setDictationInputs({
                                ...dictationInputs,
                                [entry.id]: e.target.value
                              })
                            }}
                            placeholder="在这里输入你听到的句子..."
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              // 阻止空格键触发播放/暂停
                              if (e.key === ' ') {
                                e.stopPropagation()
                              }
                            }}
                          />
                        </div>
                        
                        {/* 提交按钮和结果显示 */}
                        {dictationResults[entry.id] ? (
                          <div className="space-y-2">
                            <div className="text-base font-sans leading-relaxed">
                              {dictationResults[entry.id].map((item, index) => {
                                const isLast = index === dictationResults[entry.id].length - 1
                                const isPunctuation = /[^\w\s]/.test(item.text)
                                
                                return (
                                  <span
                                    key={index}
                                    className={
                                      item.type === 'wrong' || item.type === 'missing'
                                        ? 'text-red-400'
                                        : 'text-gray-100'
                                    }
                                  >
                                    {item.type === 'missing' ? (
                                      <span className="underline decoration-red-400">X</span>
                                    ) : (
                                      item.text
                                    )}
                                    {!isLast && !isPunctuation && ' '}
                                  </span>
                                )
                              })}
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDictationInputs({
                                    ...dictationInputs,
                                    [entry.id]: ''
                                  })
                                  const newResults = { ...dictationResults }
                                  delete newResults[entry.id]
                                  setDictationResults(newResults)
                                }}
                                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                              >
                                重新听写
                              </button>
                              <span className="text-xs text-gray-500">
                                • 白色=正确，红色=错误/漏听
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const userInput = dictationInputs[entry.id] || ''
                              if (!userInput.trim()) {
                                alert('请先输入你听到的内容')
                                return
                              }
                              const result = compareText(userInput, entry.englishText)
                              setDictationResults({
                                ...dictationResults,
                                [entry.id]: result
                              })
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
                          >
                            提交校对
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Loop 按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLoop(entry.id)
                    }}
                    className={`p-2 rounded transition-colors ${
                      isLooping
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
                    }`}
                    aria-label="Loop this sentence"
                    title="Loop this sentence"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center text-gray-400">
            <p className="mb-2">当前音频没有字幕文件</p>
            <p className="text-sm text-gray-500">
              上传同名的 SRT 或 JSON 字幕文件即可自动匹配
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

