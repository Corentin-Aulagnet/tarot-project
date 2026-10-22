/**
 * NavBar Component (components/NavBar.tsx)
 * Navigation header for the entire application.
 * 
 * Features:
 * - Desktop links: Home | New Game | Players | Statistics
 * - All route icons are displayed whenever the available width allows
 * - Current route highlighting: Active link shows bold white text
 * - Uses Heroicons for menu icons (Bars3Icon for open, XMarkIcon for close)
 * 
 * Routes:
 * - Home (/) → Dashboard with leaderboard and charts
 * - New Game (/games/new) → Form to create game
 * - Players (/players/new) → Create and manage players
 * - Home (/) → Monthly and all-time game charts and history tables
 */

"use client";
import Link from "next/link";
import "@/app/globals.css";
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  PlusCircleIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
const navigation = [
  { name: 'Home', href: '/', Icon: HomeIcon },
  { name: 'New Game', href: '/games/new', Icon: PlusCircleIcon },
  { name: 'Players', href: '/players/new', Icon: UserGroupIcon },
  { name: 'Statistics', href: '/leaderboards', Icon: TrophyIcon },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
export default function Example() {

    const currentRoute = usePathname();
  return (
    <nav className="relative bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center">
          <div className="flex flex-wrap items-center gap-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              aria-label={item.name}
              aria-current={currentRoute === item.href ? 'page' : undefined}
              className={classNames(
                currentRoute === item.href ? "bg-gray-900 text-white font-bold" : "text-gray-300 hover:bg-white/5 hover:text-white",
                "inline-flex shrink-0 items-center rounded-md p-2 text-sm font-medium"
              )}
            >
              <item.Icon aria-hidden="true" className="size-6" />
            </Link>
          ))}
          </div>
        </div>
      </div>
    </nav>
  );
}