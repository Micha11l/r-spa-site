-- Migration: Add payment_intent_id column to gift_cards table
-- Run this in your Supabase SQL editor if the column doesn't exist

-- Add payment_intent_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gift_cards' AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE gift_cards ADD COLUMN payment_intent_id text;
    CREATE INDEX IF NOT EXISTS gift_cards_payment_intent_id_idx ON gift_cards (payment_intent_id);
    
    -- Optional: Add UNIQUE constraint for production (uncomment when ready)
    -- CREATE UNIQUE INDEX IF NOT EXISTS gift_cards_payment_intent_id_unique 
    --   ON gift_cards (payment_intent_id) WHERE payment_intent_id IS NOT NULL;
  END IF;
END $$;

