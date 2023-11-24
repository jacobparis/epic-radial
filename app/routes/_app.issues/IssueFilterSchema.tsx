import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { Form, useSearchParams } from '@remix-run/react'
import { z } from 'zod'
import { Field, SelectField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { SelectGroup, SelectItem } from '#app/components/ui/select.tsx'
import { useRootLoaderData } from '#app/root.tsx'
import { ExistingParams } from './ExistingParams.tsx'

export const IssueFilterSchema = z.object({
	title: z.string().optional(),
	status: z.string().transform(value => (value === 'any' ? undefined : value)),
	priority: z
		.string()
		.transform(value => (value === 'any' ? undefined : value)),
})
export function FilterBar() {
	const { schema } = useRootLoaderData()
	const [searchParams] = useSearchParams()

	const [form, fields] = useForm({
		id: 'issues-filter-form',
		constraint: getFieldsetConstraint(IssueFilterSchema),
		onValidate({ formData }) {
			return parse(formData, { schema: IssueFilterSchema })
		},
		defaultValue: {
			title: searchParams.get('title'),
			status: searchParams.get('status') ?? 'any',
			priority: searchParams.get('priority') ?? 'any',
		},
	})

	return (
		<div className="flex gap-x-2 p-4">
			<Form
				key={searchParams.toString()}
				className="flex items-end gap-x-2"
				{...form.props}
			>
				<ExistingParams exclude={['title', 'priority', 'status', '$skip']} />

				<Field
					className="-mb-8"
					labelProps={{ children: 'Search by title' }}
					inputProps={conform.input(fields.title)}
				/>

				<SelectField
					className="w-[200px]"
					labelProps={{
						children: 'Status',
					}}
					inputProps={conform.input(fields.status)}
				>
					<SelectGroup>
						<SelectItem value="any">Any</SelectItem>
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
						<SelectItem value="any">Any</SelectItem>

						{schema.priorities.map(value => (
							<SelectItem key={value} value={value}>
								{value}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectField>

				<Button type="submit">Filter</Button>
			</Form>

			<Form className="flex items-end gap-x-2">
				<ExistingParams
					exclude={[
						fields.title.name,
						fields.priority.name,
						fields.status.name,
					]}
				/>

				<Button type="submit" variant="ghost">
					Clear
				</Button>
			</Form>
		</div>
	)
}
