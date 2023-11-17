// http://localhost:3000/

import { type Issue } from '@prisma/client'
import { type SerializeFrom } from '@remix-run/node'
import { Link, useNavigate } from '@remix-run/react'
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'
import clsx from 'clsx'
import { SelectField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Checkbox } from '#app/components/ui/checkbox.tsx'
import { SelectGroup, SelectItem } from '#app/components/ui/select.tsx'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table.tsx'
import { useBulkDeleteIssues, useBulkEditIssues } from '../issues+/_index.tsx'

type IssueRow = Pick<
	SerializeFrom<Issue>,
	'id' | 'title' | 'createdAt' | 'priority' | 'status'
>

export const columns: Array<ColumnDef<IssueRow>> = [
	{
		id: 'select',
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={value => row.toggleSelected(Boolean(value))}
				aria-label="Select row"
				className="translate-y-[2px]"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'id',
		header: 'Id',
		cell({ row }) {
			const idString = String(row.original.id).padStart(3, '0')

			return (
				<Link
					to={`/issues/${row.original.id}`}
					className="min-w-[4rem] px-4 text-neutral-600"
				>
					{idString}
				</Link>
			)
		},
	},
	{
		header: 'Title',
		accessorKey: 'title',
		size: 10,
		cell({ row }) {
			return (
				<div className="font-medium text-neutral-800">
					{row.getValue('title')}
				</div>
			)
		},
	},
	{
		accessorKey: 'priority',
		header: 'Priority',
		accessorFn(row) {
			return row.priority
		},
	},
	{
		accessorKey: 'status',
		header: 'Status',
		accessorFn(row) {
			return row.status
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Date',
		accessorFn(row) {
			return new Date(row.createdAt).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
			})
		},
		cell({ row }) {
			return (
				<div>
					<span
						title={`Created ${row.getValue('createdAt')}`}
						className="whitespace-nowrap"
					>
						{row.getValue('createdAt')}
					</span>
				</div>
			)
		},
	},
]
export function IssuesTable({ data }: { data: Array<IssueRow> }) {
	const table = useReactTable<(typeof data)[number]>({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId(row) {
			return String(row.id)
		},
	})

	const navigate = useNavigate()

	const bulkDeleteIssues = useBulkDeleteIssues()
	const bulkEditIssues = useBulkEditIssues()

	return (
		<div className="text-left">
			<div className="flex items-baseline gap-x-4 p-2">
				<span className="px-2 text-sm text-gray-600">
					{table.getSelectedRowModel().rows.length} selected
				</span>

				{table.getIsSomeRowsSelected() || table.getIsAllRowsSelected() ? (
					<>
						<Button
							variant="outline"
							onClick={() => {
								table.resetRowSelection()
							}}
						>
							Deselect
						</Button>

						<Button
							variant="outline"
							onClick={() => {
								bulkDeleteIssues({
									issues: table
										.getSelectedRowModel()
										.rows.map(row => row.original.id),
								})
								table.resetRowSelection()
							}}
						>
							Delete
						</Button>

						<SelectField
							className="w-[200px]"
							placeholder="Change priority"
							inputProps={{
								onValueChange(value: 'low' | 'medium' | 'high') {
									bulkEditIssues({
										issues: table
											.getSelectedRowModel()
											.rows.map(row => row.original.id),
										changeset: {
											priority: value,
										},
									})
								},
							}}
						>
							<SelectGroup>
								{['low', 'medium', 'high'].map(value => (
									<SelectItem key={value} value={value}>
										{value}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectField>
					</>
				) : null}
			</div>
			<Table>
				<TableHeader className="sr-only">
					{table.getHeaderGroups().map(headerGroup => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map(header => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
											  )}
									</TableHead>
								)
							})}
						</TableRow>
					))}
				</TableHeader>

				<colgroup>
					{/* Make the title column take up the rest of available space */}
					{table.getAllColumns().map(column => (
						<col
							key={column.id}
							className={column.id === 'title' ? 'w-full' : 'w-0'}
						/>
					))}
				</colgroup>

				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map(row => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && 'selected'}
								className={clsx(
									!table.getIsSomeRowsSelected() && 'cursor-pointer',
								)}
							>
								{row.getVisibleCells().map(cell => (
									<TableCell
										key={cell.id}
										onClick={event => {
											// Don't navigate if this is a checkbox
											if (cell.column.id === 'select') return

											// Don't navigate if other checkboxes are clicked
											if (table.getIsSomeRowsSelected()) return

											navigate(`/issues/${row.original.id}`)
										}}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	)
}
