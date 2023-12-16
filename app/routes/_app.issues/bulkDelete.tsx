import { conform } from '@conform-to/react'
import { useFetcher } from '@remix-run/react'
import { useCallback } from 'react'
import { z } from 'zod'
import { prisma } from '#app/utils/db.server.ts'
import { type action } from './route.tsx'

export const BulkDeleteSchema = z.object({
	[conform.INTENT]: z.literal('delete'),
	issues: z.array(z.number()),
})

type BulkDeletePayload = Omit<
	z.infer<typeof BulkDeleteSchema>,
	typeof conform.INTENT
>

export async function bulkDelete(data: BulkDeletePayload) {
	await prisma.issue.deleteMany({
		where: {
			id: {
				in: data.issues,
			},
		},
	})
}

export function useBulkDeleteFetcher() {
	type BaseFetcherType = ReturnType<typeof useFetcher<typeof action>>

	const bulkDeleteFetcher = useFetcher<typeof action>({
		key: 'bulk-delete-issues',
	}) as Omit<BaseFetcherType, 'submit' | 'json'> & {
		submit: (params: BulkDeletePayload) => void
		json?: BulkDeletePayload
	}

	// Clone the original submit to avoid a recursive loop
	const originalSubmit = bulkDeleteFetcher.submit as BaseFetcherType['submit']

	bulkDeleteFetcher.submit = useCallback(
		({ issues }: BulkDeletePayload) => {
			return originalSubmit(
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
		[originalSubmit],
	)

	return bulkDeleteFetcher
}
