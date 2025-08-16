import { Patient } from '@/hooks/usePatients';

export const exportPatientsToCsv = (patients: Patient[], filename: string = 'pacientes-arquivados.csv') => {
  if (patients.length === 0) {
    return;
  }

  // Define CSV headers
  const headers = [
    'Nome',
    'Apelido',
    'Email',
    'Telefone',
    'WhatsApp',
    'Data de Nascimento',
    'Tipo de Terapia',
    'Frequência',
    'Modalidade de Sessão',
    'Status',
    'Endereço',
    'Data de Criação',
    'Data de Arquivamento'
  ];

  // Convert patients to CSV rows
  const csvRows = patients.map(patient => [
    patient.name || '',
    patient.nickname || '',
    patient.email || '',
    patient.phone || '',
    patient.whatsapp || '',
    patient.birth_date || '',
    patient.therapy_type || '',
    patient.frequency || '',
    patient.session_mode || '',
    patient.status || '',
    patient.address || '',
    patient.created_at ? new Date(patient.created_at).toLocaleDateString('pt-BR') : '',
    patient.archived_at ? new Date(patient.archived_at).toLocaleDateString('pt-BR') : ''
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...csvRows]
    .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};