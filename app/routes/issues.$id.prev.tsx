// http://localhost:3000/issues/3/prev

import { redirect, type LoaderFunctionArgs } from '@remix-run/node'

import { prisma } from '#app/utils/db.server.ts'

export async function loader({ params }: LoaderFunctionArgs) {
	const issueId = params.id as string

	const issues = await prisma.issue.findMany({
		select: {
			id: true,
		},
		orderBy: {
			id: 'asc',
		},
	})

	const issueIndex = issues.findIndex(issue => issue.id === Number(issueId))
	const prevIssue = issues[issueIndex - 1]

	if (!prevIssue) {
		// If there is no previous issue, redirect to the final issue
		return redirect(`/issues/${issues[issues.length - 1].id}`)
	}

	return redirect(`/issues/${prevIssue.id}`)
}
