// http://localhost:3000/issues/1

import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'

import { Button } from '#app/components/ui/button.tsx'

import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'

import { invariant } from '#app/utils/misc.tsx'

export async function loader({ params }: LoaderFunctionArgs) {
	invariant(params.id, 'Missing issue ID')

	const issue = await prisma.issue.findFirst({
		where: {
			id: Number(params.id),
		},
		select: {
			id: true,
		},
	})

	if (!issue) {
		throw new Response('Not found', { status: 404 })
	}

	return json({ issue })
}

export default function Issue() {
	const { issue } = useLoaderData<typeof loader>()

	return (
		<div className="mx-auto min-h-full max-w-4xl ">
			<div className="px-4 py-6">
				<div className="flex items-center justify-between">
					<div>
						<Button variant="ghost" size="sm" asChild className="">
							<Link to="/">All issues </Link>
						</Button>
						<span>/</span>
						<span className="px-2"> {String(issue.id).padStart(3, '0')}</span>
					</div>

					<div className="flex gap-x-2">
						<Button variant="outline" size="sm" asChild className="px-2">
							<Link to={`/issues/${issue.id}/prev`} prefetch="intent">
								<Icon name="caret-up" className="h-6 w-6" />
							</Link>
						</Button>

						<Button variant="outline" size="sm" asChild className="px-2">
							<Link to={`/issues/${issue.id}/next`} prefetch="intent">
								<Icon name="caret-down" className="h-6 w-6" />
							</Link>
						</Button>
					</div>
				</div>

				<Outlet />
			</div>
		</div>
	)
}
