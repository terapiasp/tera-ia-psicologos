-- Remover constraint existente e adicionar novo constraint atualizado para sessions.type
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_type_check;

-- Adicionar novo constraint que inclui os tipos de terapia usados no sistema
ALTER TABLE sessions ADD CONSTRAINT sessions_type_check 
CHECK (type IN ('individual', 'couple', 'group', 'online', 'individual_adult', 'terapia_sp', 'particular', 'convenio'));

-- Atualizar recurring_schedules existentes para usar valores válidos
UPDATE recurring_schedules 
SET session_type = 'individual' 
WHERE session_type NOT IN ('individual', 'couple', 'group', 'online', 'individual_adult', 'terapia_sp', 'particular', 'convenio');