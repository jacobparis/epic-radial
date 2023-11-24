import { useSearchParams } from '@remix-run/react'

export function ExistingParams({
	exclude,
}: {
	exclude?: Array<string | undefined>
}) {
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
					/>
				)
			})}
		</>
	)
}
