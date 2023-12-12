import { useSearchParams } from '@remix-run/react'

export function ExistingParams({
	exclude,
	...props
}: {
	exclude?: Array<string | undefined>
} & Omit<
	React.InputHTMLAttributes<HTMLInputElement>,
	'name' | 'value' | 'type' | 'id'
>) {
	const [searchParams] = useSearchParams()
	const existingParams = Array.from(searchParams.entries()).filter(
		([key]) => !exclude?.includes(key),
	)

	return (
		<>
			{existingParams.map(([key, value]) => {
				return (
					<input
						key={`${key}=${value}`}
						type="hidden"
						name={key}
						value={value}
						{...props}
					/>
				)
			})}
		</>
	)
}
