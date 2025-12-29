import { JournalEntry } from '@/types'

/**
 * 将 SRT 时间码转换为秒数
 * @param timecode 格式: "00:00:03,500" 或 "00:00:03.500"
 */
function parseTimecode(timecode: string): number {
  const normalized = timecode.replace(',', '.')
  const parts = normalized.split(':')
  if (parts.length !== 3) {
    throw new Error(`无效的时间码格式: ${timecode}`)
  }

  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  const seconds = parseFloat(parts[2])

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    throw new Error(`无效的时间码格式: ${timecode}`)
  }

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * 解析 SRT 字幕文件
 * @param srtContent SRT 文件内容
 * @returns JournalEntry 数组
 */
export function parseSRT(srtContent: string): JournalEntry[] {
  const entries: JournalEntry[] = []
  
  // 按双换行符分割字幕块
  const blocks = srtContent.trim().split(/\n\s*\n/)
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim()
    if (!block) continue

    const lines = block.split('\n').map(line => line.trim()).filter(line => line)
    
    if (lines.length < 3) {
      // 至少需要：序号、时间码、文本
      continue
    }

    // 第一行是序号（可以忽略）
    // 第二行是时间码
    const timecodeLine = lines[1]
    const timecodeMatch = timecodeLine.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/)
    
    if (!timecodeMatch) {
      console.warn(`跳过无效的时间码: ${timecodeLine}`)
      continue
    }

    const startTime = parseTimecode(timecodeMatch[1])
    const endTime = parseTimecode(timecodeMatch[2])

    // 剩余行是文本内容
    const textLines = lines.slice(2).filter(line => line.trim())
    
    if (textLines.length === 0) {
      console.warn(`字幕块 ${i + 1} 没有文本内容`)
      continue
    }

    // 尝试分离中英文
    // 策略：按行判断，包含中文的行归为中文，否则归为英文
    const englishLines: string[] = []
    const chineseLines: string[] = []

    textLines.forEach(line => {
      const hasChinese = /[\u4e00-\u9fa5]/.test(line)
      if (hasChinese) {
        chineseLines.push(line)
      } else {
        englishLines.push(line)
      }
    })

    let englishText = englishLines.join(' ').trim()
    let chineseText = chineseLines.join(' ').trim()

    // 如果都为空，使用第一行作为英文（向后兼容）
    if (!englishText && !chineseText && textLines.length > 0) {
      englishText = textLines[0].trim()
    }

    entries.push({
      id: String(i + 1),
      startTime,
      endTime,
      englishText: englishText.trim(),
      chineseText: chineseText.trim(),
    })
  }

  return entries
}

