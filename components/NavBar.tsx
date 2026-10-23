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
  RectangleStackIcon,
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
  const isBelote = currentRoute === "/belote" || currentRoute.startsWith("/belote/");
  const activeGame = isBelote ? "BELOTE" : "TAROT";
  const gameNavigation = isBelote
    ? [
        { name: "Home", href: "/belote", Icon: HomeIcon },
        { name: "New Match", href: "/belote/new", Icon: PlusCircleIcon },
        { name: "Players", href: "/belote/players", Icon: UserGroupIcon },
        { name: "Statistics", href: "/belote/statistics", Icon: TrophyIcon },
      ]
    : navigation;
  const isCurrentItem = (href: string) => {
    if (currentRoute === href) return true;
    if (isBelote && href === "/belote") return /^\/belote\/[^/]+$/.test(currentRoute);
    return isBelote && currentRoute.startsWith(`${href}/`);
  };
  return (
    <nav className="relative z-50 bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
          {gameNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              aria-label={item.name}
              aria-current={isCurrentItem(item.href) ? 'page' : undefined}
              className={classNames(
                isCurrentItem(item.href) ? "bg-gray-900 text-white font-bold" : "text-gray-300 hover:bg-white/5 hover:text-white",
                "inline-flex shrink-0 items-center rounded-md p-2 text-sm font-medium"
              )}
            >
              <item.Icon aria-hidden="true" className="size-6" />
            </Link>
          ))}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="text-xs font-light tracking-[0.2em] text-gray-300 sm:text-sm">
              {activeGame}
            </span>
            <details className="group relative">
              <summary
                aria-label="Choose a game"
                title="Choose a game"
                className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md text-gray-300 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&::-webkit-details-marker]:hidden"
              >
                <RectangleStackIcon aria-hidden="true" className="size-6" />
              </summary>
              <div className="absolute right-0 top-full mt-2 min-w-40 rounded-md border border-gray-600 bg-gray-900 p-1 shadow-lg">
                <Link
                  href="/"
                  aria-current={!isBelote ? "page" : undefined}
                  className={`block rounded px-3 py-2 text-sm font-medium ${!isBelote ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`}
                >
                  Tarot
                </Link>
                <Link
                  href="/belote"
                  aria-current={isBelote ? "page" : undefined}
                  className={`block rounded px-3 py-2 text-sm font-medium ${isBelote ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`}
                >
                  Belote
                </Link>
              </div>
            </details>
          </div>
        </div>
      </div>
    </nav>
  );
}