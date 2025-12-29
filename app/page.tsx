'use client'

import { useState, useEffect } from 'react'
import ListeningPlayer from '@/components/ListeningPlayer'
import FileUploader from '@/components/FileUploader'
import { JournalEntry } from '@/types'

// 示例数据
const sampleData: JournalEntry[] = [
  {
    id: '1',
    startTime: 0,
    endTime: 3.5,
    englishText: 'Hello, welcome to today\'s listening practice.',
    chineseText: '你好，欢迎来到今天的听力练习。',
  },
  {
    id: '2',
    startTime: 3.5,
    endTime: 7.2,
    englishText: 'We will be working on improving your listening skills.',
    chineseText: '我们将致力于提高你的听力技能。',
  },
  {
    id: '3',
    startTime: 7.2,
    endTime: 11.8,
    englishText: 'Please listen carefully and try to understand each sentence.',
    chineseText: '请仔细听，并尝试理解每个句子。',
  },
  {
    id: '4',
    startTime: 11.8,
    endTime: 16.5,
    englishText: 'You can adjust the playback speed and toggle subtitles as needed.',
    chineseText: '你可以根据需要调整播放速度并切换字幕。',
  },
]

export default function Home() {
  const [journalData, setJournalData] = useState<JournalEntry[]>(sampleData)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [audioFileName, setAudioFileName] = useState<string>('')

  // 清理音频URL（避免内存泄漏）
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const handleAudioLoad = (url: string, fileName: string) => {
    // 清理旧的URL
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(url)
    setAudioFileName(fileName)
  }

  const handleSubtitleLoad = (data: JournalEntry[]) => {
    // 如果没有字幕数据，使用空数组
    setJournalData(data.length > 0 ? data : [])
  }

  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-gray-100">Listening Practice Player</h1>
        
        <FileUploader 
          onAudioLoad={handleAudioLoad}
          onSubtitleLoad={handleSubtitleLoad}
        />

        {audioUrl ? (
          <ListeningPlayer journalData={journalData} audioUrl={audioUrl} />
        ) : (
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <p className="text-gray-400 mb-4">请先上传音频文件以开始播放</p>
            <p className="text-sm text-gray-500">
              支持的格式：MP3, WAV, OGG, M4A 等
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

