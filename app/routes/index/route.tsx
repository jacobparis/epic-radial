// http://localhost:3000/

import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'

import { ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { prisma } from '#app/utils/db.server.ts'

import { createToastHeaders } from '#app/utils/toast.server.ts'
import { IssuesTable } from './IssuesTable.tsx'

const CreateIssueSchema = z.object({
	title: z.string({ required_error: 'Title is required' }).nonempty(),
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

	const newIssue = await prisma.issue.create({
		data: {
			title: submission.value.title,
			description: submission.value.description,
			status: 'todo',
			priority: 'medium',
			createdAt: new Date(),
		},
	})

	return json(
		{
			success: true,
			submission: {
				...submission,
				// When we send an empty payload, Conform resets the form to its default state
				// Then we're ready to start on another issue
				payload: null,
			},
		},
		{
			headers: await createToastHeaders({
				description: `Created issue ${String(newIssue.id).padStart(3, '0')} `,
				type: 'success',
			}),
		},
	)
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
	const actionData = useActionData<typeof action>()

	const [form, fields] = useForm({
		id: 'create-issue-form',
		// Adds required, min, etc props to the fields based on the schema
		constraint: getFieldsetConstraint(CreateIssueSchema),
		// Tells conform about any errors we've had
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: CreateIssueSchema })
		},
		defaultValue: {
			title: '',
			description: '',
		},
	})

	return (
		<div className="mx-auto min-h-full max-w-4xl ">
			<div className="border-x border-neutral-200">
				<IssuesTable data={issues} />
			</div>

			<div className="px-4 py-6">
				<div className="rounded-xl border px-2 py-2 shadow-sm">
					<Form method="POST" {...form.props}>
						<Input
							aria-label="Title"
							className="border-none bg-transparent text-lg font-medium placeholder:text-gray-400"
							placeholder="Issue title"
							{...conform.input(fields.title)}
						/>
						<div className="px-3">
							<ErrorList
								errors={fields.title.errors}
								id={fields.title.errorId}
							/>
						</div>

						<Textarea
							aria-label="Description"
							placeholder="Add a description…"
							className="mt-2 border-none bg-transparent placeholder:text-gray-400"
							{...conform.input(fields.description)}
						/>
						<div className="px-3">
							<ErrorList
								errors={fields.description.errors}
								id={fields.description.errorId}
							/>
						</div>

						<div className="mt-4 flex justify-end">
							<Button type="submit">Save</Button>
						</div>
					</Form>
				</div>
			</div>
		</div>
	)
}
