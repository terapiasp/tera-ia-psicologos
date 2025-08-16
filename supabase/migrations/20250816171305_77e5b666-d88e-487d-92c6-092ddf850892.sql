-- Create indexes for better performance on sessions queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_scheduled 
ON sessions(user_id, scheduled_at);

-- Create index for patients queries
CREATE INDEX IF NOT EXISTS idx_patients_user_status 
ON patients(user_id, status);