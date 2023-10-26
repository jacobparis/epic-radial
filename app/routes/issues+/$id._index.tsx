// http://localhost:3000/issues/1

import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'

import { SelectField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { SelectGroup, SelectItem } from '#app/components/ui/select.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
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

	return (
		<Form method="POST">
			<div className="mt-4 flex gap-x-2">
				<SelectField
					className="w-[200px]"
					labelProps={{
						children: 'Status',
					}}
					inputProps={{
						defaultValue: issue.status ?? undefined,
						name: 'status',
					}}
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
					inputProps={{
						defaultValue: issue.priority ?? undefined,
						name: 'priority',
					}}
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
					name="title"
					required
					disabled
					className="border-none bg-transparent text-lg font-medium placeholder:text-gray-400"
					defaultValue={issue.title}
					placeholder="Issue title"
				/>

				<Textarea
					aria-label="Description"
					name="description"
					disabled
					placeholder="Add a description…"
					className="mt-2 border-none bg-transparent placeholder:text-gray-400"
					defaultValue={issue.description ?? undefined}
				/>
			</div>

			<div className="mt-4 flex justify-end gap-x-2">
				<Button type="submit">Save</Button>
			</div>
		</Form>
	)
}
