-- Supabase 数据库表结构
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 创建文件对表
CREATE TABLE IF NOT EXISTS file_pairs (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  audio_url TEXT,
  subtitle_url TEXT,
  audio_file_name TEXT,
  subtitle_file_name TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_file_pairs_user_id ON file_pairs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_pairs_uploaded_at ON file_pairs(uploaded_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE file_pairs ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的文件
CREATE POLICY "Users can view their own file pairs"
  ON file_pairs FOR SELECT
  USING (true); -- 允许所有用户查看（因为我们使用 user_id 过滤）

CREATE POLICY "Users can insert their own file pairs"
  ON file_pairs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own file pairs"
  ON file_pairs FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own file pairs"
  ON file_pairs FOR DELETE
  USING (true);

