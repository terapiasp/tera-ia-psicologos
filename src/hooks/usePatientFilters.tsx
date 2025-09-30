import { useState, useMemo, useCallback, useEffect } from 'react';
import { Patient } from './usePatients';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SortOption = 'alphabetical' | 'created_date' | 'session_date';

export interface PatientFilters {
  search: string;
  status: string[];
  therapyTypes: string[];
  frequencies: string[];
  sessionModes: string[];
  linkStatus: string[];
  sortBy: SortOption;
}

export const defaultFilters: PatientFilters = {
  search: '',
  status: [],
  therapyTypes: [],
  frequencies: [],
  sessionModes: [],
  linkStatus: [],
  sortBy: 'alphabetical',
};

const STORAGE_KEY = 'patientFilters';

// Load filters from sessionStorage
const loadFiltersFromStorage = (): PatientFilters => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading filters from storage:', error);
  }
  return defaultFilters;
};

// Save filters to sessionStorage
const saveFiltersToStorage = (filters: PatientFilters) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Error saving filters to storage:', error);
  }
};

export const usePatientFilters = (patients: Patient[]) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<PatientFilters>(loadFiltersFromStorage);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Fetch recurring schedules for session date sorting
  const { data: recurringSchedules = [] } = useQuery({
    queryKey: ['recurring-schedules'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('recurring_schedules')
        .select('patient_id, rrule_json')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

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
    sessionStorage.removeItem(STORAGE_KEY);
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
    let result = patients.filter(patient => {
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

    // Apply sorting
    if (filters.sortBy === 'alphabetical') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else if (filters.sortBy === 'created_date') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filters.sortBy === 'session_date') {
      // Build map of patient_id -> first weekday
      const patientWeekdayMap = new Map<string, number>();
      recurringSchedules.forEach(schedule => {
        const rrule = schedule.rrule_json as any;
        if (rrule?.daysOfWeek && Array.isArray(rrule.daysOfWeek) && rrule.daysOfWeek.length > 0) {
          // Get first day of week (convert Sunday=0 to Monday=1 format)
          const firstDay = Math.min(...rrule.daysOfWeek);
          // Convert: 0(sun)=7, 1(mon)=1, 2(tue)=2, etc
          const normalizedDay = firstDay === 0 ? 7 : firstDay;
          patientWeekdayMap.set(schedule.patient_id, normalizedDay);
        }
      });

      result.sort((a, b) => {
        const dayA = patientWeekdayMap.get(a.id) ?? 999; // Patients without schedule go to end
        const dayB = patientWeekdayMap.get(b.id) ?? 999;
        if (dayA !== dayB) return dayA - dayB;
        // If same day or both without schedule, sort alphabetically
        return a.name.localeCompare(b.name, 'pt-BR');
      });
    }

    return result;
  }, [patients, debouncedSearch, filters, recurringSchedules]);

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