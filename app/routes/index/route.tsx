// http://localhost:3000/

import { parse } from '@conform-to/zod'
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { z } from 'zod'

import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { prisma } from '#app/utils/db.server.ts'

import { IssuesTable } from './IssuesTable.tsx'

const CreateIssueSchema = z.object({
	title: z.string().nonempty(),
	description: z.string().optional(),
})

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: CreateIssueSchema,
	})

	if (submission.intent !== 'submit') {
		// Conform does server-validation on blur, so if we don't stop it here it will actually submit the form
		return json({ status: 'idle', submission } as const)
	}

	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	await prisma.issue.create({
		data: {
			title: submission.value.title,
			description: submission.value.description,
			status: 'todo',
			priority: 'medium',
			createdAt: new Date(),
		},
	})

	return json({ success: true, submission })
}

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
			<div className="border-x border-neutral-200">
				<IssuesTable data={issues} />
			</div>

			<div className="px-4 py-6">
				<div className="rounded-xl border px-2 py-2 shadow-sm">
					<Form method="POST">
						<Input
							aria-label="Title"
							type="text"
							name="title"
							required
							className="border-none bg-transparent text-lg font-medium placeholder:text-gray-400"
							placeholder="Issue title"
						/>

						<Textarea
							aria-label="Description"
							name="description"
							placeholder="Add a description…"
							className="mt-2 border-none bg-transparent placeholder:text-gray-400"
						/>

						<div className="mt-4 flex justify-end">
							<Button type="submit">Save</Button>
						</div>
					</Form>
				</div>
			</div>
		</div>
	)
}
