'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { Batch, BatchStatus, STATUS_ORDER } from '@/lib/types';
import { StatusPill } from '@/components/primitives';
import { fmtDate } from '@/lib/format';
import { shortHash } from '@/lib/rng';
import { Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortField = 'batchId' | 'productName' | 'currentStatus' | 'createdAt' | 'units';
type SortDir = 'asc' | 'desc';

export function SearchFilter({ batches }: { batches: Batch[] }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handleSearch = (e: any) => {
      setQuery(e.detail);
      // optionally reset filters if needed:
      setStatusFilter('all');
      setDateFrom('');
      setDateTo('');
    };
    window.addEventListener('globalSearch', handleSearch);
    return () => window.removeEventListener('globalSearch', handleSearch);
  }, []);

  const filtered = useMemo(() => {
    let result = [...batches];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (b) =>
          b.batchId.toLowerCase().includes(q) ||
          b.productName.toLowerCase().includes(q) ||
          b.serial.toLowerCase().includes(q) ||
          b.manufacturerLabel.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((b) => b.currentStatus === statusFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((b) => b.createdAt >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      result = result.filter((b) => b.createdAt < to);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'batchId':
          cmp = a.batchId.localeCompare(b.batchId);
          break;
        case 'productName':
          cmp = a.productName.localeCompare(b.productName);
          break;
        case 'currentStatus':
          cmp = STATUS_ORDER.indexOf(a.currentStatus) - STATUS_ORDER.indexOf(b.currentStatus);
          break;
        case 'createdAt':
          cmp = a.createdAt - b.createdAt;
          break;
        case 'units':
          cmp = a.units - b.units;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [batches, query, statusFilter, sortField, sortDir, dateFrom, dateTo]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  return (
    <div className="brutal-card">
      <div className="flex items-center gap-2 border-b-2 border-black bg-white px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-black/50" strokeWidth={2.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search batch ID, product, serial, manufacturer..."
          className="flex-1 bg-transparent text-[13px] mono-data focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-black/40 hover:text-black">
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-1 border-2 border-black px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors',
            showFilters ? 'bg-black text-white' : 'bg-white hover:bg-black/5'
          )}
        >
          <Filter className="h-3.5 w-3.5" strokeWidth={2.5} />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 border-b-2 border-black/15 bg-[#F4F4F6] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-black/60">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'border-2 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]',
                statusFilter === 'all' ? 'border-black bg-black text-white' : 'border-black/30 hover:border-black'
              )}
            >
              All
            </button>
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'border-2 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]',
                  statusFilter === s ? 'border-black bg-black text-white' : 'border-black/30 hover:border-black'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-black/60">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border-2 border-black/30 bg-white px-2 py-0.5 text-[10px] mono-data focus:border-black focus:outline-none"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-black/60">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border-2 border-black/30 bg-white px-2 py-0.5 text-[10px] mono-data focus:border-black focus:outline-none"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-[10px] text-black/40 hover:text-black"
              >
                clear
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-h-[520px] overflow-y-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-[#F4F4F6]">
            <tr className="border-b-2 border-black text-[10px] uppercase tracking-[0.14em] text-black/60">
              <Th onClick={() => toggleSort('batchId')} active={sortField === 'batchId'} dir={sortDir}>
                Batch ID
              </Th>
              <Th onClick={() => toggleSort('productName')} active={sortField === 'productName'} dir={sortDir}>
                Product
              </Th>
              <Th onClick={() => toggleSort('currentStatus')} active={sortField === 'currentStatus'} dir={sortDir}>
                Status
              </Th>
              <Th onClick={() => toggleSort('units')} active={sortField === 'units'} dir={sortDir}>
                Units
              </Th>
              <Th onClick={() => toggleSort('createdAt')} active={sortField === 'createdAt'} dir={sortDir}>
                Provisioned
              </Th>
              <Th>Telemetry</Th>
              <Th>Tx</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[11px] uppercase tracking-[0.14em] text-black/50">
                  No batches match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const breach = b.telemetry.some((t) => t.breached);
                return (
                  <tr key={b.batchId} className="border-b border-black/15 text-[12px] transition-colors hover:bg-[#F4F4F6]">
                    <td className="px-3 py-2.5">
                      <div className="mono-data font-semibold">{b.batchId}</div>
                      <div className="mono-data text-[10px] text-black/50">{b.serial}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{b.productName}</div>
                      <div className="mono-data text-[10px] text-black/50">{b.manufacturerLabel}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={b.currentStatus} />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="mono-data">{b.units.toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="mono-data text-[11px]">{fmtDate(b.createdAt)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {b.telemetry.length === 0 ? (
                        <span className="mono-data text-[10px] text-black/40">—</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Thermometer className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: breach ? '#B91C1C' : '#0f5132' }} />
                          <span className="mono-data text-[11px]">{b.telemetry.length}</span>
                          {breach && (
                            <span className="border border-[#B91C1C] px-1 text-[9px] font-bold uppercase text-[#B91C1C]">BREACH</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="mono-data text-[11px]">{shortHash(b.provisionTx, 6, 4)}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t-2 border-black bg-[#F4F4F6] px-4 py-2">
        <span className="mono-data text-[10px] uppercase tracking-[0.14em] text-black/55">
          {filtered.length} of {batches.length} batches
        </span>
        {(query || statusFilter !== 'all' || dateFrom || dateTo) && (
          <button
            onClick={() => { setQuery(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); }}
            className="text-[10px] font-bold uppercase tracking-[0.12em] text-black/50 hover:text-black"
          >
            Reset all filters
          </button>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  dir?: SortDir;
}) {
  return (
    <th className="px-3 py-2 font-bold">
      <button onClick={onClick} className="flex items-center gap-1 hover:text-black">
        {children}
        {active && <ArrowUpDown className="h-3 w-3" style={{ transform: dir === 'asc' ? 'none' : 'scaleY(-1)' }} />}
      </button>
    </th>
  );
}
