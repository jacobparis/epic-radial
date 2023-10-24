import { type Issue } from '@prisma/client'
import { type SerializeFrom } from '@remix-run/node'
import { Link, useNavigate } from '@remix-run/react'
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table.tsx'

type IssueRow = Pick<SerializeFrom<Issue>, 'id' | 'title' | 'createdAt'>

export const columns: Array<ColumnDef<IssueRow>> = [
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
	})

	const navigate = useNavigate()

	return (
		<div className=" text-left">
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
								onClick={() => {
									navigate(`/issues/${row.original.id}`)
								}}
							>
								{row.getVisibleCells().map(cell => (
									<TableCell key={cell.id}>
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
