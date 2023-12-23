import { Link, NavLink, Outlet, useNavigate } from '@remix-run/react'
import clsx from 'clsx'
import { useHotkeys } from 'react-hotkeys-hook'
import { Button } from '#app/components/ui/button.tsx'

export default function AppLayout() {
	const navigate = useNavigate()

	useHotkeys('n', () => {
		navigate('/issues/new')
	})

	return (
		<div className="flex">
			<div className="flex min-h-screen min-w-[20ch] flex-col gap-y-1  border-r border-neutral-100 bg-white p-2">
				<Button asChild variant="outline">
					<Link to="/issues/new"> New issue</Link>
				</Button>
				<NavItem to="/">Home</NavItem>
				<NavItem to="/issues">Issues</NavItem>
				<NavItem to="/shortcuts">Shortcuts</NavItem>
			</div>
			<div className="grow">
				<Outlet />
			</div>
		</div>
	)
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
	return (
		<NavLink
			to={to}
			className={({ isActive }) =>
				clsx(
					'block rounded-sm px-4 py-1 text-sm font-medium',
					isActive
						? 'bg-neutral-100 text-neutral-900'
						: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
				)
			}
		>
			{children}
		</NavLink>
	)
}
