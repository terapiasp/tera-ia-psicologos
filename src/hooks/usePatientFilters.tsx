import { useState, useMemo, useCallback } from 'react';
import { Patient } from './usePatients';

export interface PatientFilters {
  search: string;
  status: string[];
  therapyTypes: string[];
  frequencies: string[];
  sessionModes: string[];
  linkStatus: string[];
}

export const defaultFilters: PatientFilters = {
  search: '',
  status: [],
  therapyTypes: [],
  frequencies: [],
  sessionModes: [],
  linkStatus: [],
};

export const usePatientFilters = (patients: Patient[]) => {
  const [filters, setFilters] = useState<PatientFilters>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const updateFilter = useCallback((key: keyof PatientFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setDebouncedSearch('');
  }, []);

  const getLinkStatus = (patient: Patient): string => {
    if (patient.link_type === 'recurring_meet' && patient.recurring_meet_code) {
      return 'configured';
    }
    if (patient.link_type === 'external' && patient.external_session_link) {
      return 'configured';
    }
    if (patient.session_link) {
      return 'configured';
    }
    return 'not_configured';
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = 
          patient.name.toLowerCase().includes(searchLower) ||
          patient.nickname?.toLowerCase().includes(searchLower) ||
          patient.whatsapp?.toLowerCase().includes(searchLower) ||
          patient.email?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(patient.status)) {
        return false;
      }

      // Therapy type filter
      if (filters.therapyTypes.length > 0 && !filters.therapyTypes.includes(patient.therapy_type)) {
        return false;
      }

      // Frequency filter
      if (filters.frequencies.length > 0 && !filters.frequencies.includes(patient.frequency)) {
        return false;
      }

      // Session mode filter
      if (filters.sessionModes.length > 0 && !filters.sessionModes.includes(patient.session_mode)) {
        return false;
      }

      // Link status filter
      if (filters.linkStatus.length > 0) {
        const patientLinkStatus = getLinkStatus(patient);
        if (!filters.linkStatus.includes(patientLinkStatus)) {
          return false;
        }
      }

      return true;
    });
  }, [patients, debouncedSearch, filters]);

  const hasActiveFilters = useMemo(() => {
    return debouncedSearch !== '' ||
           filters.status.length > 0 ||
           filters.therapyTypes.length > 0 ||
           filters.frequencies.length > 0 ||
           filters.sessionModes.length > 0 ||
           filters.linkStatus.length > 0;
  }, [debouncedSearch, filters]);

  return {
    filters,
    debouncedSearch,
    filteredPatients,
    hasActiveFilters,
    handleSearchChange,
    updateFilter,
    clearFilters,
  };
};