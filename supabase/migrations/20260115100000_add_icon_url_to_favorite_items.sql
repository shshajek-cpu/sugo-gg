-- Add icon_url column to ledger_favorite_items table
ALTER TABLE ledger_favorite_items
ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Add icon_url column to ledger_items table
ALTER TABLE ledger_items
ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Add comments
COMMENT ON COLUMN ledger_favorite_items.icon_url IS '아이템 아이콘 URL';
COMMENT ON COLUMN ledger_items.icon_url IS '아이템 아이콘 URL';
