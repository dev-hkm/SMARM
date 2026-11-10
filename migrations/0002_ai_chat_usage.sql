CREATE TABLE IF NOT EXISTS ai_chat_usage (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0 AND count <= 12),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, usage_date)
);
