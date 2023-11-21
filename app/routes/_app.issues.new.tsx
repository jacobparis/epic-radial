// http://localhost:3000/index/new

import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type ActionFunctionArgs, redirect } from '@remix-run/node'
import { Form, Link, useActionData, useNavigate } from '@remix-run/react'
import { z } from 'zod'

import { ErrorList, SelectField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from '#app/components/ui/dialog.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { SelectGroup, SelectItem } from '#app/components/ui/select.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { prisma } from '#app/utils/db.server.ts'

import {
	createToastHeaders,
	redirectWithToast,
} from '#app/utils/toast.server.ts'

const CreateIssueSchema = z.object({
	title: z.string({ required_error: 'Title is required' }).nonempty(),
	description: z.string().optional(),
	redirectPolicy: z.enum(['none', 'index', 'item']).optional(),
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

	switch (submission.value.redirectPolicy) {
		case 'index':
			return redirectWithToast(`/issues`, {
				description: `Created issue ${String(newIssue.id).padStart(3, '0')} `,
				type: 'success',
			})

		case 'item':
			return redirect(`/issues/${newIssue.id}`)

		default:
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
						description: `Created issue ${String(newIssue.id).padStart(
							3,
							'0',
						)} `,
						type: 'success',
					}),
				},
			)
	}
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
			redirectPolicy: 'none',
		},
	})

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
					<h2 className="px-3 text-neutral-600">New issue</h2>
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

								<div className="mt-4 flex justify-between">
									<SelectField
										placeholder="Redirect policy"
										inputProps={conform.input(fields.redirectPolicy)}
									>
										<SelectGroup>
											<SelectItem value="none">Keep form open</SelectItem>
											<SelectItem value="index">Redirect to index</SelectItem>
											<SelectItem value="item">Redirect to issue</SelectItem>
										</SelectGroup>
									</SelectField>

									<Button type="submit">Save</Button>
								</div>
							</Form>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
