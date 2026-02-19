-- Migration: Add user_id to meetings table for proper data isolation
-- This ensures each meeting is owned by a specific user

-- Step 1: Add user_id column (nullable for now to handle existing data)
ALTER TABLE meetings ADD COLUMN user_id UUID;

-- Step 2: Add foreign key constraint
ALTER TABLE meetings 
ADD CONSTRAINT meetings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE;

-- Step 3: Create index for faster queries
CREATE INDEX idx_meetings_user_id ON meetings(user_id);

-- Step 4: Update RLS policy to filter by user_id for anon key
DROP POLICY IF EXISTS "Anon can view meetings" ON meetings;
CREATE POLICY "Anon can view own meetings" 
    ON meetings 
    FOR SELECT 
    TO anon 
    USING (user_id = auth.uid());

-- Note: Service role policy remains unchanged (full access)
-- Existing meetings will have NULL user_id until they're created via the updated API
