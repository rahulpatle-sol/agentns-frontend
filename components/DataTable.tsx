'use client';

// DataTable: reusable, sortable table. "use client" because it keeps sort state.

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from 'lucide-react';
import { EmptyState } from './EmptyState';

type SortDirection = 'asc' | 'desc';

/** Describes one column: which field to show, its title, and (optionally) how to draw the cell. */
export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right';
  /** Optional custom cell. Receives the field value and the whole row. */
  render?: (value: unknown, item: T) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onSort?: (key: string, direction: SortDirection) => void;
  onRowClick?: (item: T) => void;
  title?: string;
  emptyMessage?: string;
  /** Stable key per row; falls back to the index. */
  getRowKey?: (item: T, index: number) => string;
  className?: string;
  /** Number of placeholder rows while loading (only used when data is empty). */
  skeletonCount?: number;
  loading?: boolean;
}

function getValue(item: unknown, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  if ((a as number) < (b as number)) return -1;
  if ((a as number) > (b as number)) return 1;
  return 0;
}

export function DataTable<T>({
  data,
  columns,
  onSort,
  onRowClick,
  title = 'Agents',
  emptyMessage = 'No agents found',
  getRowKey,
  className,
  skeletonCount = 0,
  loading,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = getValue(a, sortKey);
      const bVal = getValue(b, sortKey);
      const aEmpty = aVal === null || aVal === undefined;
      const bEmpty = bVal === null || bVal === undefined;
      if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
      const result = compareValues(aVal, bVal);
      return sortDir === 'asc' ? result : -result;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    const nextDir: SortDirection = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(nextDir);
    onSort?.(key, nextDir);
  };

  const isLoading = loading ?? (skeletonCount > 0 && data.length === 0);
  const isEmpty = !isLoading && data.length === 0;

  return (
    <div className={`card overflow-hidden ${className ?? ''}`}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {!isLoading && (
          <span className="rounded-full bg-fg/5 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted">
            {data.length} {data.length === 1 ? 'result' : 'results'}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-line">
              {columns.map((column) => {
                const isSorted = sortKey === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={`px-5 py-3 text-[11px] font-medium uppercase tracking-widest text-muted ${
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className={`inline-flex items-center gap-1.5 uppercase tracking-widest transition-colors hover:text-fg ${
                          isSorted ? 'text-fg' : ''
                        }`}
                        aria-label={`Sort by ${column.label}`}
                      >
                        {column.label}
                        {isSorted ? (
                          sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-accent" /> : <ArrowDown className="h-3 w-3 text-accent" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              Array.from({ length: skeletonCount || 6 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="border-b border-line last:border-0">
                  {columns.map((column, i) => (
                    <td key={column.key} className="px-5 py-4">
                      <div className={`skeleton h-4 ${i === 0 ? 'w-44' : 'w-20'}`} />
                    </td>
                  ))}
                </tr>
              ))}

            {isEmpty && (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState icon={SearchX} title={emptyMessage} description="Try a different search or loosen your filters." />
                </td>
              </tr>
            )}

            {!isLoading &&
              sortedData.map((item, index) => (
                <tr
                  key={getRowKey ? getRowKey(item, index) : index}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(item) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={`group border-b border-line transition-colors last:border-0 hover:bg-accent/[0.06] ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((column) => {
                    const value = getValue(item, column.key);
                    return (
                      <td
                        key={column.key}
                        className={`px-5 py-3.5 text-sm ${column.align === 'right' ? 'text-right' : ''}`}
                      >
                        {column.render ? column.render(value, item) : (
                          <span className="font-medium">{value === null || value === undefined ? '–' : String(value)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
