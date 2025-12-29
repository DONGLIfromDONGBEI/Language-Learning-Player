/**
 * 文本比较工具
 * 用于比较用户输入和正确答案，标记错误和漏听的部分
 */

export interface ComparisonResult {
  correct: string // 正确的部分
  wrong: string // 错误的部分
  missing: string // 漏听的部分（用 X 表示）
}

export interface WordComparison {
  text: string
  type: 'correct' | 'wrong' | 'missing'
}

/**
 * 比较用户输入和正确答案
 * @param userInput 用户输入
 * @param correctAnswer 正确答案
 * @returns 比较结果数组
 */
export function compareText(userInput: string, correctAnswer: string): WordComparison[] {
  // 标准化文本：转为小写，去除多余空格，但保留标点符号的位置
  const normalize = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // 多个空格合并为一个
      .trim()
  }
  
  const userNormalized = normalize(userInput)
  const correctNormalized = normalize(correctAnswer)
  
  // 按单词分割，但保留标点
  const splitWords = (text: string) => {
    // 匹配单词和标点，保留它们
    return text.match(/\b\w+\b|[^\w\s]/g) || []
  }
  
  const userWords = splitWords(userNormalized)
  const correctWords = splitWords(correctNormalized)
  
  const result: WordComparison[] = []
  let userIndex = 0
  let correctIndex = 0
  
  // 使用简单的动态规划思想进行匹配
  while (correctIndex < correctWords.length || userIndex < userWords.length) {
    if (userIndex >= userWords.length) {
      // 用户输入已结束，剩余的都是漏听的
      result.push({
        text: correctWords[correctIndex],
        type: 'missing'
      })
      correctIndex++
    } else if (correctIndex >= correctWords.length) {
      // 正确答案已结束，用户剩余的输入都是错误的
      result.push({
        text: userWords[userIndex],
        type: 'wrong'
      })
      userIndex++
    } else if (userWords[userIndex] === correctWords[correctIndex]) {
      // 完全匹配
      result.push({
        text: correctWords[correctIndex],
        type: 'correct'
      })
      userIndex++
      correctIndex++
    } else {
      // 不匹配，尝试向前查找匹配
      let foundMatch = false
      let matchDistance = 3 // 最多向前查找3个词
      
      // 在用户输入中查找当前正确答案的词
      for (let i = userIndex; i < Math.min(userIndex + matchDistance, userWords.length); i++) {
        if (userWords[i] === correctWords[correctIndex]) {
          // 找到了匹配，中间的都是错误的
          for (let j = userIndex; j < i; j++) {
            result.push({
              text: userWords[j],
              type: 'wrong'
            })
          }
          result.push({
            text: correctWords[correctIndex],
            type: 'correct'
          })
          userIndex = i + 1
          correctIndex++
          foundMatch = true
          break
        }
      }
      
      if (!foundMatch) {
        // 在正确答案中查找当前用户输入的词
        let foundInCorrect = false
        for (let i = correctIndex; i < Math.min(correctIndex + matchDistance, correctWords.length); i++) {
          if (correctWords[i] === userWords[userIndex]) {
            // 找到了，说明中间的是漏听的
            for (let j = correctIndex; j < i; j++) {
              result.push({
                text: correctWords[j],
                type: 'missing'
              })
            }
            result.push({
              text: userWords[userIndex],
              type: 'correct'
            })
            userIndex++
            correctIndex = i + 1
            foundInCorrect = true
            break
          }
        }
        
        if (!foundInCorrect) {
          // 都没找到，当前正确答案的词是漏听的，用户当前的词是错误的
          result.push({
            text: correctWords[correctIndex],
            type: 'missing'
          })
          result.push({
            text: userWords[userIndex],
            type: 'wrong'
          })
          userIndex++
          correctIndex++
        }
      }
    }
  }
  
  return result
}


