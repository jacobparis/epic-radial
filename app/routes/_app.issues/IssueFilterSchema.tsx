import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { Form, useSearchParams } from '@remix-run/react'
import { z } from 'zod'
import { Field, SelectField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { SelectGroup, SelectItem } from '#app/components/ui/select.tsx'
import { useRootLoaderData } from '#app/root.tsx'
import { ExistingParams } from './ExistingParams.tsx'

export const IssueFilterSchema = z.object({
	title: z.string().optional(),
	status: z.string().transform(value => (value === 'any' ? undefined : value)),
	priority: z
		.string()
		.transform(value => (value === 'any' ? undefined : value)),
	id: z.array(z.number()).optional(),
	removeId: z.array(z.number()).optional(),
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
		<div className="flex gap-x-2 px-4 py-2">
			<Form key={searchParams.toString()} {...form.props}>
				<ExistingParams
					exclude={['title', 'priority', 'status', '$skip', 'id']}
				/>
				<div className="flex flex-wrap items-end gap-2">
					{searchParams.getAll('id').map(id => (
						<div key={id} className="mb-2 flex items-center gap-x-2">
							<input type="hidden" name="id" value={id} />

							<Button
								variant="secondary"
								size="pill"
								type="submit"
								name="removeId"
								value={id}
								className="gap-x-2  px-2 py-1"
								title="Remove filter"
							>
								<span> #{id}</span>
								<Icon name="cross-1" />
							</Button>
						</div>
					))}
				</div>
				<div className="flex items-end gap-x-2">
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
				</div>
			</Form>

			<Form className="flex items-end gap-x-2">
				<ExistingParams
					exclude={[
						fields.title.name,
						fields.priority.name,
						fields.status.name,
						fields.id.name,
					]}
				/>

				<Button type="submit" variant="ghost">
					Clear
				</Button>
			</Form>
		</div>
	)
}
