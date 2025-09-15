-- Adiciona novos campos à tabela profiles para configurações de cobrança e templates de mensagens
ALTER TABLE public.profiles 
ADD COLUMN tipo_cobranca TEXT DEFAULT 'DIA_FIXO',
ADD COLUMN parametro_cobranca INTEGER DEFAULT 10,
ADD COLUMN template_lembrete_sessao TEXT DEFAULT 'Olá, {{paciente}}! Este é um lembrete da sua sessão agendada para {{data_hora}}. Até breve!',
ADD COLUMN template_lembrete_pagamento TEXT DEFAULT 'Olá, {{paciente}}! Este é um lembrete sobre o pagamento da sua terapia, com vencimento em {{vencimento}}. Obrigado!';

-- Adiciona comentários para documentar os novos campos
COMMENT ON COLUMN public.profiles.tipo_cobranca IS 'Método de cobrança padrão: DIA_FIXO, POR_SESSAO, PACOTE_SESSOES';
COMMENT ON COLUMN public.profiles.parametro_cobranca IS 'Parâmetro que acompanha o tipo de cobrança (ex: dia do mês, número de sessões)';
COMMENT ON COLUMN public.profiles.template_lembrete_sessao IS 'Template personalizado para lembretes de sessão com variáveis {{paciente}} e {{data_hora}}';
COMMENT ON COLUMN public.profiles.template_lembrete_pagamento IS 'Template personalizado para lembretes de pagamento com variáveis {{paciente}} e {{vencimento}}';