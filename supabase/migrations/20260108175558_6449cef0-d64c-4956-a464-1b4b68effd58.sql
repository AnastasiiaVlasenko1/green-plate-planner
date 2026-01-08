-- Add consumption tracking columns to meal_plans table
ALTER TABLE meal_plans 
ADD COLUMN is_consumed boolean NOT NULL DEFAULT false;

ALTER TABLE meal_plans 
ADD COLUMN consumed_at timestamp with time zone;