import { type Issue } from '@prisma/client'
import { json, type ActionFunctionArgs } from '@remix-run/node'

import { useFetcher } from '@remix-run/react'
import { useCallback } from 'react'
import { z } from 'zod'
import { prisma } from '#app/utils/db.server.ts'

const BulkDeleteSchema = z.object({
	issues: z.array(z.number()),
})

export async function action({ request, params }: ActionFunctionArgs) {
	const formData = await request.json()
	const submission = BulkDeleteSchema.safeParse(formData)

	if (!submission.success) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	if (submission.data.issues.length === 0) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	await prisma.issue.deleteMany({
		where: {
			id: {
				in: submission.data.issues,
			},
		},
	})

	return json({ success: true, submission })
}

export function useBulkDeleteIssues() {
	const fetcher = useFetcher()
	const submit = useCallback(
		(issues: Array<Issue['id']>) => {
			fetcher.submit(
				{
					issues,
				},
				{
					method: 'POST',
					action: '/issues/delete',
					encType: 'application/json',
				},
			)
		},
		[fetcher],
	)

	return submit
}
