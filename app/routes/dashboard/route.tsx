// http://localhost:3000/dashboard

import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'

import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'

import { IssuesTable } from './IssuesTable.tsx'

export async function loader({ request }: LoaderFunctionArgs) {
	const issues = await prisma.issue.findMany({
		select: {
			id: true,
			title: true,
			description: true,
			status: true,
			priority: true,
			createdAt: true,
		},
	})

	return json({ issues })
}

export default function Dashboard() {
	const { issues } = useLoaderData<typeof loader>()

	return (
		<div className="mx-auto min-h-full max-w-4xl ">
			<div className="py-2">
				<Button asChild>
					<Link to="/dashboard/new"> New issue</Link>
				</Button>
			</div>

			<div className="border border-neutral-200">
				<IssuesTable data={issues} />
			</div>

			<Outlet />
		</div>
	)
}
