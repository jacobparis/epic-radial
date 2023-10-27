// http://localhost:3000/issues/1

import { json, type LoaderFunctionArgs } from '@remix-run/node'
import {
	Link,
	Outlet,
	useLoaderData,
	useLocation,
	useParams,
} from '@remix-run/react'

import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
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
		<div className="mx-auto min-h-full max-w-4xl" key={issue.id}>
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

export function ErrorBoundary() {
	const params = useParams()

	const id = Number(params.id)
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => (
					<div className="mx-auto min-h-full max-w-4xl">
						<div className="px-4 py-6">
							<div className="flex items-center justify-between">
								<div>
									<Button variant="ghost" size="sm" asChild className="">
										<Link to="/">All issues </Link>
									</Button>
									<span>/</span>
									<span className="px-2"> {String(id).padStart(3, '0')}</span>
								</div>
							</div>

							<div className="grid place-items-center gap-6 text-center">
								<div className="flex min-h-[60vh] flex-col justify-center gap-3">
									<h1 className="text-lg font-medium">Issue not found</h1>
									<p className="text-gray-500">
										<Icon
											name="info-circled"
											className="h-5 w-5 align-text-top"
										/>{' '}
										There is no issue with the number{' '}
										<strong className="font-medium text-gray-900">
											{String(id).padStart(3, '0')}
										</strong>
									</p>
								</div>
							</div>
						</div>
					</div>
				),
			}}
		/>
	)
}
