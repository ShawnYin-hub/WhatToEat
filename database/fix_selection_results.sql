-- =====================================================
-- 修复 selection_results 表：添加缺失的 address 字段
-- 如果表已存在但没有 address 字段，执行此 SQL
-- =====================================================

-- 检查并添加 address 字段（如果不存在）
DO $$ 
BEGIN
    -- 检查 address 字段是否存在
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'selection_results' 
        AND column_name = 'address'
    ) THEN
        -- 添加 address 字段
        ALTER TABLE selection_results 
        ADD COLUMN address TEXT;
        
        RAISE NOTICE '✅ 已添加 address 字段到 selection_results 表';
    ELSE
        RAISE NOTICE 'ℹ️ address 字段已存在，无需添加';
    END IF;
END $$;

-- 验证字段是否存在
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'selection_results'
ORDER BY ordinal_position;
