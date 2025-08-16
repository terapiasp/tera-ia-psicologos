-- Create recurring_schedules table for patient recurrence rules
CREATE TABLE public.recurring_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  
  -- Recurrence rule in JSON format for flexibility
  rrule_json JSONB NOT NULL,
  
  -- Session details
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  session_type TEXT NOT NULL DEFAULT 'individual',
  session_value NUMERIC,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recurring_exceptions table for handling exceptions to recurring rules
CREATE TABLE public.recurring_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES public.recurring_schedules(id) ON DELETE CASCADE,
  
  -- Exception details
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('cancelled', 'rescheduled')),
  new_datetime TIMESTAMP WITH TIME ZONE, -- For rescheduled sessions
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to sessions table
ALTER TABLE public.sessions 
ADD COLUMN schedule_id UUID REFERENCES public.recurring_schedules(id) ON DELETE SET NULL,
ADD COLUMN origin TEXT NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual', 'recurring'));

-- Enable RLS on new tables
ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_exceptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recurring_schedules
CREATE POLICY "Users can view their own recurring schedules" 
ON public.recurring_schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring schedules" 
ON public.recurring_schedules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring schedules" 
ON public.recurring_schedules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring schedules" 
ON public.recurring_schedules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for recurring_exceptions
CREATE POLICY "Users can view their own recurring exceptions" 
ON public.recurring_exceptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring exceptions" 
ON public.recurring_exceptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring exceptions" 
ON public.recurring_exceptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring exceptions" 
ON public.recurring_exceptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_recurring_schedules_user_id ON public.recurring_schedules(user_id);
CREATE INDEX idx_recurring_schedules_patient_id ON public.recurring_schedules(patient_id);
CREATE INDEX idx_recurring_exceptions_schedule_id ON public.recurring_exceptions(schedule_id);
CREATE INDEX idx_sessions_schedule_id ON public.sessions(schedule_id);

-- Create unique index to prevent duplicate sessions from recurring schedules
CREATE UNIQUE INDEX idx_sessions_recurring_unique 
ON public.sessions(schedule_id, scheduled_at) 
WHERE schedule_id IS NOT NULL;

-- Add trigger for updating timestamps
CREATE TRIGGER update_recurring_schedules_updated_at
BEFORE UPDATE ON public.recurring_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();