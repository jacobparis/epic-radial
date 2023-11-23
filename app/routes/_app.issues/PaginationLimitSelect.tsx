import { type SelectProps } from '@radix-ui/react-select'
import { useSearchParams, Form } from '@remix-run/react'
import { SelectField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { SelectGroup, SelectItem } from '#app/components/ui/select.tsx'

export function PaginationLimitSelect(
	inputProps: React.SelectHTMLAttributes<HTMLSelectElement> & SelectProps,
) {
	const [searchParams] = useSearchParams()
	const existingParams = Array.from(searchParams.entries()).filter(
		([key]) => key !== '$top',
	)

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
			{existingParams.map(([key, value]) => {
				return <input key={key} type="hidden" name={key} value={value} />
			})}

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
