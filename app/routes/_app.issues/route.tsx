// http://localhost:3000/issues

import { conform } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { type Prisma } from '@prisma/client'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
	redirect,
} from '@remix-run/node'
import { Outlet, useLoaderData, Link } from '@remix-run/react'
import { z } from 'zod'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { clearEmptyParams, wait } from '#app/utils/misc.tsx'
import { bulkDelete, BulkDeleteSchema } from './bulkDelete.tsx'
import { bulkEdit, BulkEditSchema } from './bulkEdit.tsx'
import { IssueFilterSchema, FilterBar } from './IssueFilterSchema.tsx'
import { IssuesTable } from './IssuesTable.tsx'
import { PaginationBar } from './PaginationBar.tsx'
import { PaginationLimitSelect } from './PaginationLimitSelect.tsx'

const BulkSchema = z.discriminatedUnion(conform.INTENT, [
	BulkEditSchema,
	BulkDeleteSchema,
])

export async function action({ request, params }: ActionFunctionArgs) {
	const formData = await request.json()
	const submission = BulkSchema.safeParse(formData)

	await wait(2000)

	if (!submission.success) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	if (submission.data.issues.length === 0) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	if (submission.data.__intent__ === 'delete') {
		await bulkDelete(submission.data)

		return json({ success: true, submission })
	}

	if (submission.data[conform.INTENT] === 'edit') {
		await bulkEdit(submission.data)

		return json({ success: true, submission })
	}

	return json(
		{
			status: `${
				submission.data[conform.INTENT] satisfies never
			} not implemented`,
			submission,
		} as const,
		{ status: 405 },
	)
}

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)
	await clearEmptyParams(url)

	const submission = parse(url.searchParams, {
		schema: IssueFilterSchema.merge(IssuePaginationSchema).partial(),
	})

	if (!submission.value) {
		// Just a safeguard to keep types happy now and protect us if the schema changes later
		throw new Error('Invalid submission')
	}

	if (submission.value.removeId && submission.value.id) {
		const remainingIds = submission.value.id.filter(
			id => !submission.value?.removeId?.includes(id),
		)

		url.searchParams.delete('id')
		url.searchParams.delete('removeId')
		for (const id of remainingIds) {
			url.searchParams.append('id', String(id))
		}

		return redirect(url.toString())
	}

	const $top = submission.value.$top ?? 10
	const $skip = submission.value.$skip || 0

	const where: Prisma.IssueWhereInput = {
		id: submission.value.id ? { in: submission.value.id } : undefined,
		title: {
			contains: submission.value.title ?? undefined,
		},
		status: submission.value.status ?? undefined,
		priority: submission.value.priority ?? undefined,
	}

	const issueIds = await prisma.issue.findMany({
		where,
		select: { id: true },
	})

	const issues = await prisma.issue.findMany({
		where,
		select: {
			id: true,
			title: true,
			description: true,
			status: true,
			priority: true,
			createdAt: true,
		},
		orderBy: {
			id: 'asc',
		},
		skip: $skip,
		take: $top * 2 || undefined,
	})

	return json({
		$top,
		issueIds: issueIds.map(issue => issue.id),
		issues: issues,
	})
}

const IssuePaginationSchema = z.object({
	$top: z.number().optional(),
	$skip: z.number().optional(),
})

export default function Dashboard() {
	const { $top, issueIds, issues } = useLoaderData<typeof loader>()

	return (
		<div className="min-h-full ">
			<div className="bg-white">
				<FilterBar />

				<IssuesTable issues={issues} issueIds={issueIds} pageSize={$top} />

				<div className="flex justify-between p-2">
					{$top ? <PaginationBar total={issueIds.length} /> : null}

					<PaginationLimitSelect defaultValue={String($top)} />
				</div>
			</div>

			<div className="grid place-items-center gap-4 p-8">
				<p className="text-neutral-700">
					Generate sample issues for development purposes
				</p>
				<Button asChild>
					<Link to="/issues/new-bulk">Create more issues</Link>
				</Button>
			</div>

			<Outlet />
		</div>
	)
}
