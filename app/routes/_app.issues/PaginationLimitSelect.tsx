import { type SelectProps } from '@radix-ui/react-select'
import { Form } from '@remix-run/react'
import { SelectField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { SelectGroup, SelectItem } from '#app/components/ui/select.tsx'
import { ExistingParams } from './ExistingParams.tsx'

export function PaginationLimitSelect(
	inputProps: React.SelectHTMLAttributes<HTMLSelectElement> & SelectProps,
) {
	return (
		<Form
			preventScrollReset
			method="GET"
			className="flex grow gap-x-2"
			onChange={event => {
				if (event.target instanceof HTMLSelectElement) {
					event.target.form?.requestSubmit()
				}
			}}
		>
			<ExistingParams exclude={['$top']} />

			<SelectField
				className="ml-auto w-[200px]"
				inputProps={{
					name: '$top',
					...inputProps,
				}}
			>
				<SelectGroup>
					<SelectItem value="10">Show 10 issues</SelectItem>
					<SelectItem value="50">Show 50 issues</SelectItem>
					<SelectItem value="100">Show 100 issues</SelectItem>
					<SelectItem value="0">Show all issues</SelectItem>
				</SelectGroup>
			</SelectField>

			<Button type="submit" className="sr-only">
				Update
			</Button>
		</Form>
	)
}
