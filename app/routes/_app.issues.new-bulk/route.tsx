// http://localhost:3000/issues/new-bulk

import { type ActionFunctionArgs } from '@remix-run/node'
import { Form, Link, useNavigate } from '@remix-run/react'

import { Button } from '#app/components/ui/button.tsx'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from '#app/components/ui/dialog.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

import { redirectWithToast } from '#app/utils/toast.server.ts'
import { generateIssues } from './generateIssues.tsx'

export async function action({ request }: ActionFunctionArgs) {
	const quantity = 10

	await generateIssues(quantity)

	return redirectWithToast(`/issues`, {
		description: `Created ${quantity} issues`,
		type: 'success',
	})
}

export default function Dashboard() {
	const navigate = useNavigate()
	const dismissModal = () =>
		navigate('..', { preventScrollReset: true, replace: true })

	return (
		<Dialog open={true}>
			<DialogContent
				onEscapeKeyDown={dismissModal}
				onPointerDownOutside={dismissModal}
			>
				<DialogTitle asChild>
					<h2 className="px-3 text-neutral-600">Bulk create sample issues</h2>
				</DialogTitle>

				<DialogClose asChild>
					<Button
						asChild
						className="absolute right-3 top-3 h-auto p-3"
						variant="ghost"
					>
						<Link preventScrollReset to=".." aria-label="Close">
							<Icon name="cross-1" className="h-4 w-4" />
						</Link>
					</Button>
				</DialogClose>

				<div>
					<div className="inline-flex w-full flex-col  gap-8 text-left">
						<div>
							<Form method="POST">
								<div className="px-3">
									This will generate a bunch of random issues for development
									purposes
								</div>

								<div className="mt-4 flex justify-end">
									<Button type="submit">Create</Button>
								</div>
							</Form>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
