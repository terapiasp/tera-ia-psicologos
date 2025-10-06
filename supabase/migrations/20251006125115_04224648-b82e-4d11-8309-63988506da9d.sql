-- Remove o constraint problemático que causa duplicate key errors
DROP INDEX IF EXISTS idx_sessions_recurring_unique;