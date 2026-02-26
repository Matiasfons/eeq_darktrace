'use client';

import { useState, useEffect, useCallback } from 'react';
import FilterSidebar from './FilterSidebar';
import ResponseTable from './ResponseTable';
import { AntigenaAction, Filters, ActionStatus } from '@/lib/types';
import { loadActionsByIp } from '@/lib/data';

interface DeviceViewProps {
  ip: string;
}

export default function DeviceView({ ip }: DeviceViewProps) {
  const [allActions, setAllActions] = useState<AntigenaAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    dateFrom: null,
    dateTo: null,
    actionType: 'all',
    showManual: true,
    showBlocked: true,
    search: '',
    statusTab: 'active',
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    loadActionsByIp(ip).then((data) => {
      setAllActions(data);
      setLoading(false);
    });
  }, [ip]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setStatusTab = useCallback((tab: ActionStatus) => {
    setFilters((prev) => ({ ...prev, statusTab: tab }));
  }, []);

  return (
    <>
      <FilterSidebar filters={filters} updateFilter={updateFilter} />
      <ResponseTable
        ip={ip}
        allActions={allActions}
        filters={filters}
        updateFilter={updateFilter}
        setStatusTab={setStatusTab}
        loading={loading}
        onRefresh={handleRefresh}
      />
    </>
  );
}
