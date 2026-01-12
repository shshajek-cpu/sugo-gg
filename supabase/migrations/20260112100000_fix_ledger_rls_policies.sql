-- Fix RLS policies for ledger tables to allow INSERT

-- Drop existing policies and recreate with proper permissions
DROP POLICY IF EXISTS "Public access" ON ledger_users;
DROP POLICY IF EXISTS "Public access" ON ledger_characters;
DROP POLICY IF EXISTS "Public access" ON ledger_daily_records;
DROP POLICY IF EXISTS "Public access" ON ledger_record_items;
DROP POLICY IF EXISTS "Public access" ON ledger_items;

-- ledger_users policies
CREATE POLICY "Allow public read on ledger_users"
    ON ledger_users FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on ledger_users"
    ON ledger_users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on ledger_users"
    ON ledger_users FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on ledger_users"
    ON ledger_users FOR DELETE
    USING (true);

-- ledger_characters policies
CREATE POLICY "Allow public read on ledger_characters"
    ON ledger_characters FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on ledger_characters"
    ON ledger_characters FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on ledger_characters"
    ON ledger_characters FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on ledger_characters"
    ON ledger_characters FOR DELETE
    USING (true);

-- ledger_daily_records policies
CREATE POLICY "Allow public read on ledger_daily_records"
    ON ledger_daily_records FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on ledger_daily_records"
    ON ledger_daily_records FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on ledger_daily_records"
    ON ledger_daily_records FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on ledger_daily_records"
    ON ledger_daily_records FOR DELETE
    USING (true);

-- ledger_record_items policies
CREATE POLICY "Allow public read on ledger_record_items"
    ON ledger_record_items FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on ledger_record_items"
    ON ledger_record_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on ledger_record_items"
    ON ledger_record_items FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on ledger_record_items"
    ON ledger_record_items FOR DELETE
    USING (true);

-- ledger_items policies (master data)
CREATE POLICY "Allow public read on ledger_items"
    ON ledger_items FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on ledger_items"
    ON ledger_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on ledger_items"
    ON ledger_items FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on ledger_items"
    ON ledger_items FOR DELETE
    USING (true);
