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
import { useState } from 'react'
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
import { useRootLoaderData } from '#app/root.tsx'
import { useBulkDeleteIssues, useBulkEditIssues } from './route.tsx'

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
export function IssuesTable({
	data,
	issueIds,
}: {
	data: Array<IssueRow>
	issueIds: Array<number>
}) {
	const [rowSelection, setRowSelection] = useState({})
	const table = useReactTable<(typeof data)[number]>({
		state: {
			rowSelection,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
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
	const { schema } = useRootLoaderData()

	return (
		<div className="text-left">
			<div className="flex items-center gap-x-4 p-2">
				<span className="h-8 p-2 text-sm tabular-nums text-gray-600">
					{Object.keys(rowSelection).length} selected
				</span>

				{data.some(({ id }) => !(id in rowSelection)) ? (
					<Button
						variant="outline"
						onClick={() => {
							table.setRowSelection(existingSelection => {
								const selection = { ...existingSelection }

								for (const row of data) {
									selection[row.id] = true
								}

								return selection
							})
						}}
					>
						Select page
					</Button>
				) : (
					<Button
						variant="outline"
						disabled={issueIds.length === Object.keys(rowSelection).length}
						onClick={() => {
							table.setRowSelection(existingSelection => {
								const selection = { ...existingSelection }

								for (const id of issueIds) {
									selection[id] = true
								}

								return selection
							})
						}}
					>
						Select all
					</Button>
				)}

				{Object.keys(rowSelection).length > 0 ? (
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
									issues: Object.keys(rowSelection).map(id => Number(id)),
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
								onValueChange(value: (typeof schema.priorities)[number]) {
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
								{schema.priorities.map(value => (
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
