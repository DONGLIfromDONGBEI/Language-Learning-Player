/**
 * 云端存储工具
 * 使用 Supabase Storage 实现跨设备文件同步
 */

import { supabase, isCloudSyncEnabled } from '@/lib/supabase'

export interface CloudFilePair {
  id: string
  name: string
  audioUrl: string | null
  subtitleUrl: string | null
  audioFileName: string | null
  subtitleFileName: string | null
  uploadedAt: number
  userId?: string
}

/**
 * 生成用户 ID（基于浏览器指纹，无需登录）
 */
function getUserId(): string {
  // 尝试从 localStorage 获取
  let userId = localStorage.getItem('listening_player_user_id')
  
  if (!userId) {
    // 生成新的用户 ID
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('listening_player_user_id', userId)
  }
  
  return userId
}

/**
 * 上传文件到云端
 */
export async function uploadFileToCloud(
  file: File,
  pairId: string,
  type: 'audio' | 'subtitle'
): Promise<string | null> {
  if (!isCloudSyncEnabled() || !supabase) {
    return null
  }

  try {
    const userId = getUserId()
    const filePath = `${userId}/${pairId}/${type}/${file.name}`
    
    const { data, error } = await supabase.storage
      .from('listening-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('上传文件失败:', error)
      return null
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('listening-files')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error('上传文件异常:', error)
    return null
  }
}

/**
 * 保存文件对元数据到数据库
 */
export async function saveFilePairToCloud(
  pairId: string,
  name: string,
  audioUrl: string | null,
  subtitleUrl: string | null,
  audioFileName: string | null,
  subtitleFileName: string | null
): Promise<boolean> {
  if (!isCloudSyncEnabled() || !supabase) {
    return false
  }

  try {
    const userId = getUserId()
    
    const { error } = await supabase
      .from('file_pairs')
      .upsert({
        id: pairId,
        user_id: userId,
        name,
        audio_url: audioUrl,
        subtitle_url: subtitleUrl,
        audio_file_name: audioFileName,
        subtitle_file_name: subtitleFileName,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id,user_id'
      })

    if (error) {
      console.error('保存文件对失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('保存文件对异常:', error)
    return false
  }
}

/**
 * 从云端获取所有文件对
 */
export async function getAllFilePairsFromCloud(): Promise<CloudFilePair[]> {
  if (!isCloudSyncEnabled() || !supabase) {
    return []
  }

  try {
    const userId = getUserId()
    
    const { data, error } = await supabase
      .from('file_pairs')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('获取文件对失败:', error)
      return []
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      audioUrl: item.audio_url,
      subtitleUrl: item.subtitle_url,
      audioFileName: item.audio_file_name,
      subtitleFileName: item.subtitle_file_name,
      uploadedAt: new Date(item.uploaded_at).getTime(),
      userId: item.user_id
    }))
  } catch (error) {
    console.error('获取文件对异常:', error)
    return []
  }
}

/**
 * 从云端下载文件
 */
export async function downloadFileFromCloud(url: string): Promise<File | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('下载文件失败')
    }
    
    const blob = await response.blob()
    const fileName = url.split('/').pop() || 'file'
    return new File([blob], fileName, { type: blob.type })
  } catch (error) {
    console.error('下载文件失败:', error)
    return null
  }
}

/**
 * 删除云端文件对
 */
export async function deleteFilePairFromCloud(pairId: string): Promise<boolean> {
  if (!isCloudSyncEnabled() || !supabase) {
    return false
  }

  try {
    const userId = getUserId()
    
    // 先获取文件信息（在删除数据库记录之前）
    const { data: fileData } = await supabase
      .from('file_pairs')
      .select('audio_file_name, subtitle_file_name')
      .eq('id', pairId)
      .eq('user_id', userId)
      .single()

    // 删除存储文件
    if (fileData) {
      const filesToDelete: string[] = []
      if (fileData.audio_file_name) {
        filesToDelete.push(`${userId}/${pairId}/audio/${fileData.audio_file_name}`)
      }
      if (fileData.subtitle_file_name) {
        filesToDelete.push(`${userId}/${pairId}/subtitle/${fileData.subtitle_file_name}`)
      }
      
      if (filesToDelete.length > 0) {
        await supabase.storage
          .from('listening-files')
          .remove(filesToDelete)
      }
    }

    // 删除数据库记录
    const { error: dbError } = await supabase
      .from('file_pairs')
      .delete()
      .eq('id', pairId)
      .eq('user_id', userId)

    if (dbError) {
      console.error('删除文件对失败:', dbError)
      return false
    }

    return true
  } catch (error) {
    console.error('删除文件对异常:', error)
    return false
  }
}

