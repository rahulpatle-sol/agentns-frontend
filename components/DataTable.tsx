'use client';

// DataTable: a reusable, sortable table used for the agents list (and other lists).
// "use client" is needed because this component uses React state (useState).

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

type SortDirection = 'asc' | 'desc';

/** Describes one column: which field to show, its title, and (optionally) how to draw the cell. */
export interface DataTableColumn<T> {
  /** Name of the field on each row object, for example "stakeLamports". */
  key: string;
  /** Text shown in the column header. */
  label: string;
  /** If true, clicking the header sorts the table by this column. */
  sortable?: boolean;
  /** Optional custom cell. Receives the field value and the whole row. */
  render?: (value: any, item: T) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Called after the user changes the sort. Handy if the parent also sorts or fetches. */
  onSort?: (key: string, direction: SortDirection) => void;
  /** Called when a row is clicked (or Enter is pressed on it). Use it to open the agent page. */
  onRowClick?: (item: T) => void;
  /** Heading shown above the table. */
  title?: string;
  /** Text shown when there are no rows. */
  emptyMessage?: string;
  className?: string;
  /** Number of placeholder rows to show while loading (only used when data is empty). */
  skeletonCount?: number;
}

// Reads one field from a row. Rows are plain objects, so we read them by key.
function getValue(item: unknown, key: string): any {
  return (item as Record<string, any>)[key];
}

// Compares two non-empty values: text uses localeCompare, everything else uses < and >.
function compareValues(a: any, b: any): number {
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function DataTable<T>({
  data,
  columns,
  onSort,
  onRowClick,
  title = 'Agents',
  emptyMessage = 'No agents found',
  className,
  skeletonCount = 0,
}: DataTableProps<T>) {
  // Which column is sorted and in which direction. null means "not sorted".
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  // Sort a copy of the data (never change the original array).
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = getValue(a, sortKey);
      const bVal = getValue(b, sortKey);
      // Empty values always go to the bottom, whatever the direction.
      const aEmpty = aVal === null || aVal === undefined;
      const bEmpty = bVal === null || bVal === undefined;
      if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
      const result = compareValues(aVal, bVal);
      return sortDir === 'asc' ? result : -result;
    });
  }, [data, sortKey, sortDir]);

  // Click on a header: same column flips the direction, a new column starts ascending.
  const handleSort = (key: string) => {
    const nextDir: SortDirection = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(nextDir);
    onSort?.(key, nextDir);
  };

  // Loading = we were asked for skeleton rows and there is no data yet.
  const isLoading = skeletonCount > 0 && data.length === 0;
  const isEmpty = !isLoading && data.length === 0;

  return (
    <div className={className ?? ''}>
      <div className="bg-surface rounded-xl border border-explorer p-4">
        <h3 className="text-lg font-medium text-explorer">{title}</h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                {columns.map((column) => {
                  const isSorted = sortKey === column.key;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className="p-3 text-left text-xs font-medium uppercase tracking-wider text-muted"
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column.key)}
                          className="inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-explorer"
                          aria-label={`Sort by ${column.label}`}
                        >
                          {column.label}
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
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
              {/* Loading: grey pulsing placeholder rows */}
              {isLoading &&
                Array.from({ length: skeletonCount }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`} className="border-t border-explorer">
                    {columns.map((column) => (
                      <td key={column.key} className="p-3">
                        <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-white/10" />
                      </td>
                    ))}
                  </tr>
                ))}

              {/* Empty: nothing to show */}
              {isEmpty && (
                <tr className="border-t border-explorer">
                  <td colSpan={columns.length} className="p-6 text-center text-sm text-muted">
                    {emptyMessage}
                  </td>
                </tr>
              )}

              {/* Real rows */}
              {sortedData.map((item, index) => (
                <tr
                  key={index}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter') onRowClick(item);
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  className={`border-t border-explorer transition-colors hover:bg-white/5 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((column) => {
                    const value = getValue(item, column.key);
                    return (
                      <td key={column.key} className="p-3 text-sm text-explorer">
                        {column.render ? (
                          column.render(value, item)
                        ) : (
                          <span className="font-medium">
                            {value === null || value === undefined ? '-' : String(value)}
                          </span>
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
    </div>
  );
}