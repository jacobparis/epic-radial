import { type Issue } from '@prisma/client'
import { json, type ActionFunctionArgs } from '@remix-run/node'

import { useFetcher } from '@remix-run/react'
import { useCallback } from 'react'
import { z } from 'zod'
import { prisma } from '#app/utils/db.server.ts'

const BulkEditSchema = z.object({
	issues: z.array(z.number()),
	changeset: z
		.object({
			priority: z.enum(['low', 'medium', 'high']),
		})
		.partial(),
})

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.json()
	const submission = BulkEditSchema.safeParse(formData)

	if (!submission.success) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	if (submission.data.issues.length === 0) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

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

export function useBulkEditIssues() {
	const fetcher = useFetcher()
	const submit = useCallback(
		(issues: Array<Issue['id']>, changeset: Pick<Issue, 'priority'>) => {
			fetcher.submit(
				{
					issues,
					changeset,
				},
				{
					method: 'POST',
					action: '/issues/edit',
					encType: 'application/json',
				},
			)
		},
		[fetcher],
	)

	return submit
}
