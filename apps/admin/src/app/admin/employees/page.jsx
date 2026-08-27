"use client"

import { useMemo, useState } from "react"
import { useTable } from "@tanstack/react-table"
import { KeyRoundIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, SearchIcon, UserXIcon } from "lucide-react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin-page-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { EmployeeDialog } from "@/components/employee-dialog"
import { OwnerDialog } from "@/components/owner-dialog"
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table"
import { EMPLOYEES } from "@/lib/employees"

export default function Page() {
  const [employees, setEmployees] = useState(EMPLOYEES)
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState([{ id: "name", desc: false }])
  const [rowSelection, setRowSelection] = useState({})
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const data = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return employees
    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(query) ||
        employee.role.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query)
    )
  }, [employees, search])

  function handleSave(updated) {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)))
  }

  function handleResetPin(employee) {
    toast.success(`PIN reset for ${employee.name}`)
  }

  function handleDeactivate(employee) {
    toast.success(`${employee.name} deactivated`)
  }

  function handleDelete() {
    setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id))
    toast.success(`${deleteTarget.name} removed`)
    setDeleteTarget(null)
  }

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => <DataGridColumnHeader title="Name" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className={`text-white ${row.original.color}`}>
                {row.original.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{row.original.name}</span>
          </div>
        ),
        minSize: 220,
        enableSorting: true,
        enableHiding: false,
        meta: { autoSize: true },
      },
      {
        accessorKey: "email",
        id: "email",
        header: ({ column }) => <DataGridColumnHeader title="Email" column={column} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email || "—"}</span>
        ),
        size: 240,
      },
      {
        accessorKey: "phone",
        id: "phone",
        header: ({ column }) => <DataGridColumnHeader title="Phone" column={column} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.phone || "—"}</span>
        ),
        size: 180,
      },
      {
        accessorKey: "role",
        id: "role",
        header: ({ column }) => <DataGridColumnHeader title="Role" column={column} />,
        cell: ({ row }) => <div className="text-muted-foreground">{row.original.role}</div>,
        size: 160,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Edit employee"
              onClick={(e) => {
                e.stopPropagation()
                setEditingEmployee(row.original)
              }}>
              <PencilIcon className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    title="More actions"
                    onClick={(e) => e.stopPropagation()} />
                }>
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => handleResetPin(row.original)}>
                  <KeyRoundIcon />
                  Reset PIN
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDeactivate(row.original)}>
                  <UserXIcon />
                  Deactivate
                </DropdownMenuItem>
                {row.original.role !== "Owner" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(row.original)}>
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 80,
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data,
    pageCount: Math.ceil((data?.length || 0) / pagination.pageSize),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    state: {
      pagination,
      sorting,
      rowSelection,
    },
    initialState: {
      columnPinning: {
        start: ["select", "name"],
        end: [],
      },
      rowPinning: {
        top: employees.filter((e) => e.role === "Owner").map((e) => e.id),
      },
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
  })

  return (
    <>
      <AdminPageHeader crumbs={[{ label: "Employees" }, { label: "Employee list" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center gap-2">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-600/90">
            <PlusIcon />
            Add employee
          </Button>
          <div className="relative ml-auto w-64">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataGrid
          table={table}
          recordCount={data?.length || 0}
          onRowClick={(employee) => setEditingEmployee(employee)}
          tableLayout={{ columnsPinnable: true, columnsResizable: true, rowsPinnable: true }}>
          <div className="w-full space-y-2.5">
            <Card className="p-0 [&_tr[data-row-pinned]]:bg-emerald-50 [&_tr[data-row-pinned]]:hover:bg-emerald-100 dark:[&_tr[data-row-pinned]]:bg-emerald-950/30 dark:[&_tr[data-row-pinned]]:hover:bg-emerald-950/50">
              <DataGridContainer>
                <DataGridScrollArea>
                  <DataGridTable />
                </DataGridScrollArea>
              </DataGridContainer>
            </Card>
            <DataGridPagination />
          </div>
        </DataGrid>
      </div>
      {editingEmployee?.role === "Owner" ? (
        <OwnerDialog
          employee={editingEmployee}
          open={Boolean(editingEmployee)}
          onOpenChange={(open) => !open && setEditingEmployee(null)}
          onSave={handleSave} />
      ) : (
        <EmployeeDialog
          employee={editingEmployee}
          open={Boolean(editingEmployee)}
          onOpenChange={(open) => !open && setEditingEmployee(null)}
          onSave={handleSave} />
      )}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll lose access to the POS and back office immediately. This can&apos;t
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
