"use client";
import { createContext, useContext, useEffect, useMemo, useRef } from "react"
import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  metaHelper,
  rowExpandingFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_alphanumericCaseSensitive,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  sortFn_textCaseSensitive,
  tableFeatures,
} from "@tanstack/react-table"

import { cn } from "@/lib/utils"

/**
 * The batteries-included feature bundle every ReUI data-grid example builds
 * on. v9 requires each table to declare its features up front, and the grid's
 * render path needs the ones registered here: `columnVisibilityFeature` alone
 * gates `row.getVisibleCells()`, so even a grid that never hides a column
 * needs it to render at all.
 *
 * Pass it straight through for the full grid:
 *
 * ```tsx
 * const table = useTable({ features: dataGridFeatures, columns, data })
 * ```
 *
 * Extend it when a grid needs more, keeping each prerequisite feature ahead of
 * the slot that depends on it:
 *
 * ```tsx
 * const features = tableFeatures({
 *   ...dataGridFeatures,
 *   columnGroupingFeature,
 *   groupedRowModel: createGroupedRowModel(),
 * })
 * ```
 *
 * Or drop it entirely and hand `<DataGrid>` a leaner table - the components
 * accept any bundle, so you keep full ownership of the TanStack core.
 */
export const dataGridFeatures = tableFeatures({
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  // columnResizingFeature requires columnSizingFeature, declared above.
  columnResizingFeature,
  columnFilteringFeature,
  // Powers DataGridColumnFilter's column.getFacetedUniqueValues(). On v8 an
  // unregistered facet silently returned an empty map; on v9 the method would
  // not exist at all, so the faceted row models below are required, not
  // optional.
  columnFacetingFeature,
  // globalFilteringFeature requires columnFilteringFeature, declared above.
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  rowPinningFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  // Every built-in v9 ships. A string `sortFn` resolves against this map
  // alone, and `sortFn: "auto"` infers a name ("alphanumeric", "text" or
  // "datetime") from the first row's value - so a partial map makes auto
  // sorting warn and silently fall back on ordinary string columns.
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    alphanumericCaseSensitive: sortFn_alphanumericCaseSensitive,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
    textCaseSensitive: sortFn_textCaseSensitive,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnMeta: metaHelper(),
});

/** Label for headers / column visibility: `meta.headerTitle`, string `columnDef.header`, or `column.id`. */
export function getColumnHeaderLabel(column) {
  const meta = column.columnDef.meta
  if (typeof meta?.headerTitle === "string") return meta.headerTitle
  const defHeader = column.columnDef.header
  if (typeof defHeader === "string") return defHeader
  return String(column.id);
}

function createDataGridAutoSizeController(
  /**
   * A getter, not the table itself.
   *
   * v8 handed back one stable table whose state mutated in place, so a
   * controller could close over it. v9 returns a NEW table wrapper on every
   * state change, and a captured one keeps reporting the state it was built
   * with - here that meant `columnSizing` looked permanently empty, the
   * applied-once guard re-armed on every measurement, and the fill overwrote
   * whatever width the user had just dragged the column to.
   */
  getTable
) {
  let applied = null

  return {
    apply(fillWidth) {
      const table = getTable()
      const columnSizing = table.state.columnSizing

      // Re-arm after reset flows (double-click resetSize, resetColumnSizing,
      // controlled state replacement) so the column re-fills instead of
      // leaving a dead blank strip.
      if (applied && columnSizing[applied.columnId] === undefined) {
        applied = null
      }

      if (fillWidth <= 0) return false

      const autoSizeColumn = table
        .getVisibleLeafColumns()
        .find((column) => column.columnDef.meta?.autoSize && column.getCanResize())

      if (!autoSizeColumn || applied?.columnId === autoSizeColumn.id) {
        return false
      }

      // A width this coordinator did not write belongs to someone else -
      // almost always the user, who just dragged the column's resize handle.
      // Filling over it is what made a `meta.autoSize` column look
      // un-resizable: the drag committed, the next viewport measurement
      // stamped the fill back on top, and the column snapped to its old width.
      //
      // Deliberately keyed on observed state rather than on `applied`, which
      // is per-coordinator memory: anything that rebuilds the coordinator
      // (a remount, a new table store) forgets what it did, and the guard has
      // to survive that. An explicit reset clears the entry and re-arms the
      // fill, which is what makes double-click-to-reset still work.
      const currentSize = columnSizing[autoSizeColumn.id]
      if (currentSize !== undefined && currentSize !== applied?.grown) {
        return false
      }

      // Candidate switched (e.g. the grown column was hidden and another
      // meta.autoSize column took over): revert the previous growth if the
      // user hasn't manually resized that column since, so visibility
      // toggles cannot ratchet the table wider than its container forever.
      const revert =
        applied && columnSizing[applied.columnId] === applied.grown
          ? applied
          : null
      const base = columnSizing[autoSizeColumn.id] ?? autoSizeColumn.getSize()
      const grown = base + fillWidth

      applied = { columnId: autoSizeColumn.id, base, grown }
      table.setColumnSizing((old) => {
        const next = { ...old, [autoSizeColumn.id]: grown }
        if (revert && next[revert.columnId] === revert.grown) {
          next[revert.columnId] = revert.base
        }
        return next
      })

      return true
    },
  };
}

const DataGridContext = createContext(// eslint-disable-next-line @typescript-eslint/no-explicit-any
undefined)

/**
 * Reads the grid context. Pass `TData` from the calling component when the
 * table, a row or a cell is handed on to something typed against that row
 * shape: v9 declares `TData` invariant, so the default `any` no longer
 * unifies with a concrete row type the way it did on v8.
 */
function useDataGrid() {
  const context = useContext(DataGridContext)
  if (!context) {
    throw new Error("useDataGrid must be used within a DataGridProvider")
  }
  return context
}

function DataGridProvider(
  {
    children,
    table,
    ...props
  }
) {
  // Latest-props ref: context reads always resolve fresh props through the
  // getter below without the memoized context value depending on unstable
  // ReactNode/function prop identities (inline emptyMessage/onRowClick would
  // otherwise publish a new context value on every consumer render - at
  // mousemove rate during a resize drag, piercing the body-rows memo).
  const propsRef = useRef(props)
  propsRef.current = props

  // Same treatment for the table itself, which v9 - unlike v8 - re-creates on
  // every state change. Depending on it directly would republish the context
  // on each resize tick, which is exactly what the memo below exists to
  // prevent; the getter still hands every consumer the current instance.
  const tableRef = useRef(table)
  tableRef.current = table

  // Re-assert an explicit tableLayout resize mode so consumer-level useTable
  // options cannot flip it back between drags. v9 makes `table.options`
  // readonly, so this goes through setOptions in an effect rather than a
  // render-phase mutation. Without an explicit mode, the consumer's own
  // tanstack columnResizeMode (default "onEnd") is honored.
  const resizeMode =
    props.tableLayout?.columnsResizable && props.tableLayout.columnsResizeMode
      ? props.tableLayout.columnsResizeMode
      : undefined

  useEffect(() => {
    if (!resizeMode) return
    if (table.options.columnResizeMode === resizeMode) return
    table.setOptions((old) => ({ ...old, columnResizeMode: resizeMode }))
  }, [table, resizeMode])

  // One autoSize coordinator per table instance so split header/body viewports
  // cannot apply the growth twice. Keyed on `table.store`, which v9 keeps
  // stable for the life of the table, rather than on `table` itself: the
  // wrapper is re-created on every state change, and re-creating the
  // controller with it would reset its applied-once bookkeeping mid-drag.
  const autoSize = useMemo(
    () => createDataGridAutoSizeController(() => tableRef.current),
    [table.store]
  )

  const tableState = table.state

  // Memoize context value so consumers don't re-render during column resize.
  // Column sizing state is intentionally excluded from deps -- CSS variables
  // on the <table> element handle width updates without React re-renders.
  // ReactNode/function props (messages, onRowClick) are also excluded: they
  // are served fresh through the props getter, so unstable inline identities
  // cannot invalidate the context value.
  const value = useMemo(() => ({
    get props() {
      return propsRef.current
    },
    get table() {
      return tableRef.current
    },
    recordCount: props.recordCount,
    isLoading: props.isLoading || false,
    autoSize,
  }), // eslint-disable-next-line react-hooks/exhaustive-deps
  [
    autoSize,
    props.recordCount,
    props.isLoading,
    props.loadingMode,
    props.className,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(props.tableLayout),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(props.tableClassNames),
    tableState.sorting,
    tableState.pagination,
    tableState.columnFilters,
    tableState.rowSelection,
    tableState.rowPinning,
    tableState.expanded,
    tableState.columnVisibility,
    tableState.columnOrder,
    tableState.columnPinning,
    tableState.globalFilter,
  ])

  return (
    // One React context serves every TData, but v9 declares both TFeatures and
    // TData invariant, so a `DataGridContextProps<any>` context cannot accept a
    // `DataGridContextProps<TData>` value structurally. The erasure happens
    // here and is undone by the TData generic on each consumer component.
    <DataGridContext.Provider value={value}>
      {children}
    </DataGridContext.Provider>
  );
}

function DataGrid(
  {
    children,
    table,
    ...props
  }
) {
  const defaultProps = {
    loadingMode: "skeleton",
    tableLayout: {
      dense: false,
      cellBorder: false,
      rowBorder: true,
      rowRounded: false,
      stripped: false,
      headerSticky: false,
      headerBackground: false,
      footerBackground: false,
      headerBorder: true,
      width: "fixed",
      columnsVisibility: false,
      columnsResizable: false,
      // columnsResizeMode has no default on purpose: when unset, the
      // consumer's tanstack columnResizeMode (default "onEnd") is honored.
      columnsPinnable: false,
      columnsMovable: false,
      columnsDraggable: false,
      rowsDraggable: false,
      rowsPinnable: false,
    },
    tableClassNames: {
      base: "",
      header: "",
      headerRow: "",
      // z-40 keeps the sticky header above pinned body cells (zIndex 30 in
      // getPinningStyles), which would otherwise paint over it while
      // scrolling vertically with columnsPinnable enabled.
      headerSticky: "sticky top-0 z-40 bg-background/90 backdrop-blur-xs",
      body: "",
      bodyRow: "",
      footer: "",
      edgeCell: "",
    },
  }

  const mergedProps = {
    ...defaultProps,
    ...props,
    tableLayout: {
      ...defaultProps.tableLayout,
      ...(props.tableLayout || {}),
    },
    tableClassNames: {
      ...defaultProps.tableClassNames,
      ...(props.tableClassNames || {}),
    },
  }

  // Ensure table is provided
  if (!table) {
    throw new Error('DataGrid requires a "table" prop')
  }

  // The single widening point. Consumers own the TanStack core and may hand
  // over any feature bundle; internals need a concrete one to resolve the
  // feature-gated APIs they call, and v9's invariant TFeatures rules out
  // expressing that with a generic constraint.
  const internalTable = table
  const internalProps = mergedProps

  return (
    <DataGridProvider table={internalTable} {...internalProps}>
      {children}
    </DataGridProvider>
  );
}

function DataGridContainer({
  children,
  className
}) {
  return (
    <div data-slot="data-grid" className={cn("w-full overflow-hidden", className)}>
      {children}
    </div>
  );
}

export { useDataGrid, DataGridProvider, DataGrid, DataGridContainer }