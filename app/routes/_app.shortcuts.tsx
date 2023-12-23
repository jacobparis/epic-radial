// http://localhost:3000/shortcuts

export default function Shortcuts() {
	return (
		<div className="min-h-full">
			<div className="bg-white px-8 py-4">
				<h1 className="text-xl font-bold"> Keyboard shortcuts </h1>

				<dl className="mt-4 max-w-[20ch]">
					<div className="flex justify-between">
						<dt>new issue </dt>
						<dd>
							<kbd className="rounded-sm bg-neutral-200 px-2 py-1">n</kbd>
						</dd>
					</div>
				</dl>

				<h2 className="mt-8 text-xl font-bold"> Issue list </h2>

				<dl className="mt-4 max-w-[20ch]">
					<div className="flex justify-between">
						<dt> select issue </dt>
						<dd>
							<kbd className="rounded-sm bg-neutral-200 px-2 py-1">
								cmd click
							</kbd>
						</dd>
					</div>

					<div className="flex justify-between">
						<dt> select page/all </dt>
						<dd>
							<kbd className="rounded-sm bg-neutral-200 px-2 py-1">cmd a</kbd>
						</dd>
					</div>
					<div className="flex justify-between">
						<dt> deselect </dt>
						<dd>
							<kbd className="rounded-sm bg-neutral-200 px-2 py-1">
								shift cmd a
							</kbd>
						</dd>
					</div>
				</dl>

				<h2 className="mt-8 text-xl font-bold"> Issue view </h2>

				<dl className="mt-4 max-w-[20ch]">
					<div className="flex justify-between">
						<dt>next issue </dt>
						<dd>
							<kbd className="rounded-sm bg-neutral-200 px-2 py-1">j</kbd>
						</dd>
					</div>
					<div className="flex justify-between">
						<dt>previous issue </dt>
						<dd>
							<kbd className="rounded-sm bg-neutral-200 px-2 py-1">k</kbd>
						</dd>
					</div>
				</dl>
			</div>
		</div>
	)
}
