import { conform } from '@conform-to/react'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { useCallback } from 'react'
import { z } from 'zod'
import { prisma } from '#app/utils/db.server.ts'

const BulkDeleteSchema = z.object({
	[conform.INTENT]: z.literal('delete'),
	issues: z.array(z.number()),
})

const BulkEditSchema = z.object({
	[conform.INTENT]: z.literal('edit'),
	issues: z.array(z.number()),
	changeset: z
		.object({
			priority: z.enum(['low', 'medium', 'high']),
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