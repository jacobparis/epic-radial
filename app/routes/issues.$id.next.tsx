// http://localhost:3000/issues/1/next

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
	const nextIssue = issues[issueIndex + 1]

	if (!nextIssue) {
		// If there is no next issue, redirect to the first issue
		return redirect(`/issues/${issues[0].id}`)
	}

	return redirect(`/issues/${nextIssue.id}`)
}
