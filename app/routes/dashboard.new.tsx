// http://localhost:3000/dashboard/new

import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { z } from 'zod'

import { ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { prisma } from '#app/utils/db.server.ts'

import { createToastHeaders } from '#app/utils/toast.server.ts'

const CreateIssueSchema = z.object({
	title: z.string({ required_error: 'Title is required' }).nonempty(),
	description: z.string().optional(),
})

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: CreateIssueSchema,
	})

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

export default function Dashboard() {
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
		<div className="px-4 py-6">
			<Button asChild>
				<Link to="/dashboard">
					<Icon name="cross-1" className="h-6 w-6" />
				</Link>
			</Button>

			<div className="rounded-xl border px-2 py-2 shadow-sm">
				<Form method="POST" {...form.props}>
					<Input
						aria-label="Title"
						className="border-none bg-transparent text-lg font-medium placeholder:text-gray-400"
						placeholder="Issue title"
						{...conform.input(fields.title)}
					/>
					<div className="px-3">
						<ErrorList errors={fields.title.errors} id={fields.title.errorId} />
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
	)
}
