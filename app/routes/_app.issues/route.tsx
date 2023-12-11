// http://localhost:3000/issues

import { conform } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { type Prisma } from '@prisma/client'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { Outlet, useLoaderData, useFetcher, Link } from '@remix-run/react'
import { useCallback } from 'react'
import { z } from 'zod'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { IssueFilterSchema, FilterBar } from './IssueFilterSchema.tsx'
import { IssuesTable } from './IssuesTable.tsx'
import { PaginationBar } from './PaginationBar.tsx'
import { PaginationLimitSelect } from './PaginationLimitSelect.tsx'

const BulkDeleteSchema = z.object({
	[conform.INTENT]: z.literal('delete'),
	issues: z.array(z.number()),
})

const BulkEditSchema = z.object({
	[conform.INTENT]: z.literal('edit'),
	issues: z.array(z.number()),
	changeset: z
		.object({
			priority: z.string(),
		})
		.partial(),
})

const BulkSchema = z.discriminatedUnion(conform.INTENT, [
	BulkEditSchema,
	BulkDeleteSchema,
])

export async function action({ request, params }: ActionFunctionArgs) {
	const formData = await request.json()
	const submission = BulkSchema.safeParse(formData)

	if (!submission.success) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	if (submission.data.issues.length === 0) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	if (submission.data[conform.INTENT] === 'delete') {
		await prisma.issue.deleteMany({
			where: {
				id: {
					in: submission.data.issues,
				},
			},
		})

		return json({ success: true, submission })
	}

	if (submission.data[conform.INTENT] === 'edit') {
		await prisma.issue.updateMany({
			where: {
				id: {
					in: submission.data.issues,
				},
			},
			data: {
				priority: submission.data.changeset.priority ?? undefined,
			},
		})

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

export function useBulkDeleteIssues() {
	const fetcher = useFetcher()
	const submit = useCallback(
		({
			issues,
		}: Omit<z.infer<typeof BulkDeleteSchema>, typeof conform.INTENT>) => {
			fetcher.submit(
				{
					[conform.INTENT]: 'delete',
					issues,
				},
				{
					method: 'POST',
					action: '/issues',
					encType: 'application/json',
				},
			)
		},
		[fetcher],
	)

	return submit
}

export function useBulkEditIssues() {
	const fetcher = useFetcher()
	const submit = useCallback(
		({
			issues,
			changeset,
		}: Omit<z.infer<typeof BulkEditSchema>, typeof conform.INTENT>) => {
			fetcher.submit(
				{
					[conform.INTENT]: 'edit',
					issues,
					changeset,
				},
				{
					method: 'POST',
					action: '/issues',
					encType: 'application/json',
				},
			)
		},
		[fetcher],
	)

	return submit
}

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url)

	const submission = parse(url.searchParams, {
		schema: IssueFilterSchema.merge(IssuePaginationSchema).partial(),
	})

	if (!submission.value) {
		// Just a safeguard to keep types happy now and protect us if the schema changes later
		throw new Error('Invalid submission')
	}

	const $top = submission.value.$top ?? 10
	const $skip = submission.value.$skip || 0

	const where: Prisma.IssueWhereInput = {
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
		take: $top || undefined,
	})

	return json({
		$top,
		issueIds: issueIds.map(issue => issue.id),
		issues,
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

				<IssuesTable data={issues} issueIds={issueIds} />

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
