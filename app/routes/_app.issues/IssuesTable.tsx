// http://localhost:3000/

import { type Issue } from '@prisma/client'
import { type SerializeFrom } from '@remix-run/node'
import { Form, Link, useNavigate } from '@remix-run/react'
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
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
import { useBulkDeleteFetcher } from './bulkDelete.tsx'
import { useBulkEditFetcher } from './bulkEdit.tsx'
import { ExistingParams } from './ExistingParams.tsx'

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

let runawayRenders = 1000

export function IssuesTable({
	issues,
	pageSize,
	issueIds,
}: {
	issues: Array<IssueRow>
	pageSize: number
	issueIds: Array<number>
}) {
	if (runawayRenders-- <= 0) {
		throw new Error('Runaway renders')
	}
	const pageIssues = useMemo(
		() => issues.slice(0, pageSize),
		[issues, pageSize],
	)
	const extraIssues = useMemo(() => issues.slice(pageSize), [issues, pageSize])
	const [rowSelection, setRowSelection] = useState({})

	const bulkDeleteFetcher = useBulkDeleteFetcher()
	const bulkEditFetcher = useBulkEditFetcher()

	const memoizedData = useMemo(() => {
		return pageIssues
			.filter(issue => {
				if (bulkDeleteFetcher.json?.issues.includes(issue.id)) {
					return false
				}

				return true
			})
			.map(issue => {
				if (bulkEditFetcher.json?.issues.includes(issue.id)) {
					return {
						...issue,
						...bulkEditFetcher.json.changeset,
					}
				}

				return issue
			})
			.concat(extraIssues.slice(0, bulkDeleteFetcher?.json?.issues.length ?? 0))
	}, [
		pageIssues,
		extraIssues,
		bulkDeleteFetcher.json?.issues,
		bulkEditFetcher.json?.issues,
		bulkEditFetcher.json?.changeset,
	])

	const table = useReactTable<(typeof issues)[number]>({
		state: {
			rowSelection,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		data: memoizedData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId(row) {
			return String(row.id)
		},
	})

	const navigate = useNavigate()

	const { schema } = useRootLoaderData()

	return (
		<div className="text-left">
			<div className="flex items-center gap-x-4 p-2">
				<span className="inline-flex h-8 items-center justify-center gap-x-2 p-2 text-sm tabular-nums text-gray-600">
					<Checkbox
						checked={memoizedData.every(row => row.id in rowSelection)}
						onCheckedChange={() => {
							if (memoizedData.every(row => row.id in rowSelection)) {
								table.resetRowSelection()
								return
							}

							table.setRowSelection(existingSelection => {
								const selection = { ...existingSelection }

								for (const row of pageIssues) {
									selection[row.id] = true
								}

								return selection
							})
						}}
						aria-label={`${Object.keys(rowSelection).length} selected`}
					/>
					{`${Object.keys(rowSelection).length} selected`}
				</span>

				{Object.keys(rowSelection).length > 0 ? (
					<>
						<Form method="GET">
							<ExistingParams
								exclude={['$skip', '$top', 'title', 'status', 'priority', 'id']}
							/>
							{Object.keys(rowSelection).map(id => (
								<input key={id} type="hidden" name="id" value={id} />
							))}

							<Button type="submit" variant="outline">
								View selection
							</Button>
						</Form>
					</>
				) : null}

				{issueIds.length === Object.keys(rowSelection).length ? (
					<Button
						variant="link"
						onClick={() => {
							table.resetRowSelection()
						}}
					>
						Clear selection
					</Button>
				) : (
					<Button
						variant="link"
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
						Select all {issueIds.length}
					</Button>
				)}
			</div>

			{Object.keys(rowSelection).length > 0 ? (
				<div className="flex items-center gap-x-4 p-2">
					<Button
						variant="outline"
						onClick={() => {
							bulkDeleteFetcher.submit({
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
								bulkEditFetcher.submit({
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
				</div>
			) : null}
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
