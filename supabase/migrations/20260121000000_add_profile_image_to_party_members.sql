-- Add profile_image column to party_members table
ALTER TABLE party_members
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add comment
COMMENT ON COLUMN party_members.profile_image IS 'Character profile image URL';
