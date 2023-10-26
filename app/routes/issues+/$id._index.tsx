// http://localhost:3000/issues/1

import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'

import { z } from 'zod'
import { ErrorList, SelectField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { SelectGroup, SelectItem } from '#app/components/ui/select.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { prisma } from '#app/utils/db.server.ts'

import { invariant } from '#app/utils/misc.tsx'

const EditIssueSchema = z.object({
	title: z.string({ required_error: 'Title is required' }).nonempty(),
	description: z.string().optional(),
	status: z.enum(['todo', 'in-progress', 'done']).optional(),
	priority: z.enum(['low', 'medium', 'high']).optional(),
})

export async function action({ request, params }: ActionFunctionArgs) {
	invariant(params.id, 'Missing issue ID')

	const formData = await request.formData()
	const submission = parse(formData, {
		schema: EditIssueSchema,
	})

	if (submission.intent !== 'submit') {
		// Conform does server-validation on blur, so if we don't stop it here it will actually submit the form
		return json({ status: 'idle', submission } as const)
	}

	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	await prisma.issue.update({
		where: {
			id: Number(params.id),
		},
		data: {
			title: submission.value.title,
			description: submission.value.description,
			status: submission.value.status,
			priority: submission.value.priority,
		},
	})

	return json({ success: true, submission })
}

export async function loader({ params }: LoaderFunctionArgs) {
	invariant(params.id, 'Missing issue ID')

	const issue = await prisma.issue.findFirst({
		where: {
			id: Number(params.id),
		},
		select: {
			id: true,
			title: true,
			description: true,
			status: true,
			priority: true,
			createdAt: true,
		},
	})

	if (!issue) {
		throw new Response('Not found', { status: 404 })
	}

	return json({ issue })
}

export default function Issue() {
	const { issue } = useLoaderData<typeof loader>()

	const actionData = useActionData<typeof action>()

	const [form, fields] = useForm({
		id: 'edit-issue-form',
		// Adds required, min, etc props to the fields based on the schema
		constraint: getFieldsetConstraint(EditIssueSchema),
		// Tells conform about any errors we've had
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: EditIssueSchema })
		},
		defaultValue: {
			title: issue.title,
			description: issue.description ?? '',
			status: issue.status ?? undefined,
			priority: issue.priority ?? undefined,
		},
	})

	return (
		<Form method="POST" {...form.props}>
			<div className="mt-4 flex gap-x-2">
				<SelectField
					className="w-[200px]"
					labelProps={{
						children: 'Status',
					}}
					inputProps={conform.input(fields.status)}
				>
					<SelectGroup>
						{['todo', 'in-progress', 'done'].map(value => (
							<SelectItem key={value} value={value}>
								{value}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectField>

				<SelectField
					className="w-[200px]"
					labelProps={{
						children: 'Priority',
					}}
					inputProps={conform.input(fields.priority)}
				>
					<SelectGroup>
						{['low', 'medium', 'high'].map(value => (
							<SelectItem key={value} value={value}>
								{value}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectField>
			</div>

			<div className="mt-2 rounded-xl border px-2 py-2 shadow-sm">
				<Input
					aria-label="Title"
					type="text"
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
			</div>

			<div className="mt-4 flex justify-end gap-x-2">
				<Button type="submit">Save</Button>
			</div>
		</Form>
	)
}
