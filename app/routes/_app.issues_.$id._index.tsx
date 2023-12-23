// http://localhost:3000/issues/1

import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'

import { useRef } from 'react'
import { useDebounceSubmit } from 'remix-utils/use-debounce-submit'
import { z } from 'zod'
import { ErrorList, SelectField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { SelectGroup, SelectItem } from '#app/components/ui/select.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { useRootLoaderData } from '#app/root.tsx'
import { prisma } from '#app/utils/db.server.ts'

import { invariant, wait } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const EditIssueSchema = z.object({
	title: z.string({ required_error: 'Title is required' }).nonempty(),
	description: z.string().optional(),
	status: z.string().optional(),
	priority: z.string().optional(),
})

export async function action({ request, params }: ActionFunctionArgs) {
	invariant(params.id, 'Missing issue ID')

	await wait(5000)

	const formData = await request.formData()
	const submission = parse(formData, {
		schema: EditIssueSchema,
	})

	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	if (submission.intent === 'edit') {
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

	if (submission.intent === 'delete') {
		await prisma.issue.delete({
			where: {
				id: Number(params.id),
			},
		})

		return redirectWithToast('/', {
			description: `Deleted issue ${String(params.id).padStart(3, '0')} `,
			type: 'success',
		})
	}

	throw new Error(`Method not implemented ${submission.intent satisfies never}`)
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
	const saveButton = useRef<HTMLButtonElement>(null)

	const submit = useDebounceSubmit()

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

	const { schema } = useRootLoaderData()

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
						{schema.statuses.map(value => (
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
						{schema.priorities.map(value => (
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
					onClick={e => {
						if (!window.getSelection()?.toString()) {
							e.currentTarget.select()
						}
					}}
					onChange={e => {
						submit(saveButton.current, {
							navigate: false,
							fetcherKey: 'edit-issue-title',
							debounceTimeout: 500,
						})
					}}
					onBlur={e => {
						submit(saveButton.current, {
							navigate: false,
							fetcherKey: 'edit-issue-title',
							debounceTimeout: 0,
						})
					}}
				/>
				<div className="px-3">
					<ErrorList errors={fields.title.errors} id={fields.title.errorId} />
				</div>

				<Textarea
					aria-label="Description"
					placeholder="Add a description…"
					className="mt-2 border-none bg-transparent placeholder:text-gray-400"
					{...conform.input(fields.description)}
					onChange={e => {
						submit(saveButton.current, {
							navigate: false,
							fetcherKey: 'edit-issue-description',
							debounceTimeout: 500,
						})
					}}
					onBlur={e => {
						submit(saveButton.current, {
							navigate: false,
							fetcherKey: 'edit-issue-description',
							debounceTimeout: 0,
						})
					}}
				/>
				<div className="px-3">
					<ErrorList
						errors={fields.description.errors}
						id={fields.description.errorId}
					/>
				</div>
			</div>

			<div className="mt-4 flex justify-end gap-x-2">
				<Button
					type="submit"
					name={conform.INTENT}
					value="delete"
					variant="outline"
				>
					Delete
				</Button>

				<Button
					ref={saveButton}
					type="submit"
					name={conform.INTENT}
					value="edit"
				>
					Save
				</Button>
			</div>
		</Form>
	)
}
