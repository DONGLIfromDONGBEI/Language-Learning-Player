/**
 * Supabase 客户端配置
 * 用于文件云端存储和跨设备同步
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 如果未配置 Supabase，返回 null（使用本地存储）
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// 检查是否启用了云端同步
export const isCloudSyncEnabled = () => {
  return supabase !== null
}





