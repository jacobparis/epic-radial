import { conform } from '@conform-to/react'
import { useFetcher } from '@remix-run/react'
import { useCallback } from 'react'
import { z } from 'zod'
import { prisma } from '#app/utils/db.server.ts'
import { type action } from './route.tsx'

export const BulkEditSchema = z.object({
	[conform.INTENT]: z.literal('edit'),
	issues: z.array(z.number()),
	changeset: z
		.object({
			priority: z.string(),
		})
		.partial(),
})

type BulkEditPayload = Omit<
	z.infer<typeof BulkEditSchema>,
	typeof conform.INTENT
>

export async function bulkEdit(data: BulkEditPayload) {
	await prisma.issue.updateMany({
		where: {
			id: {
				in: data.issues,
			},
		},
		data: {
			priority: data.changeset.priority ?? undefined,
		},
	})
}

export function useBulkEditFetcher() {
	type BaseFetcherType = ReturnType<typeof useFetcher<typeof action>>

	type BulkEditPayload = {
		issues: Array<number>
		changeset: { priority: string }
	}

	const fetcher = useFetcher<typeof action>({
		key: 'bulk-edit-issues',
	}) as Omit<BaseFetcherType, 'submit' | 'json'> & {
		submit: (params: BulkEditPayload) => void
		json?: BulkEditPayload
	}

	// Clone the original submit to avoid a recursive loop
	const originalSubmit = fetcher.submit as BaseFetcherType['submit']

	fetcher.submit = useCallback(
		({ issues, changeset }: BulkEditPayload) => {
			return originalSubmit(
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
		[originalSubmit],
	)

	return fetcher
}
