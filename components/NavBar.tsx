/**
 * NavBar Component (components/NavBar.tsx)
 * Navigation header for the entire application.
 * 
 * Features:
 * - Desktop links: Home | New Game | Players | Statistics
 * - Mobile menu: Hamburger button (via Headless UI Disclosure)
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
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import {
  Bars3Icon,
  HomeIcon,
  PlusCircleIcon,
  TrophyIcon,
  UserGroupIcon,
  XMarkIcon,
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
    <Disclosure as="nav" className="relative bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500">
              <span className="absolute -inset-0.5" />
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={item.name}
                    aria-label={item.name}
                    aria-current={currentRoute === item.href ? 'page' : undefined}
                    className={classNames(
                      currentRoute === item.href ? "text-white bg-gray-900 font-bold" : "text-gray-300 hover:bg-white/5 hover:text-white"
    ,                   " rounded-md p-2 text-sm font-medium")}
                  >
                    <item.Icon aria-hidden="true" className="size-6" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
          </div>
          </div>
           <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
              title={item.name}
              aria-label={item.name}
              aria-current={currentRoute === item.href ? 'page' : undefined}
              className={classNames(
                      currentRoute === item.href ? "text-white bg-gray-900" : "text-gray-300 hover:bg-white/5 hover:text-white"
    ,                   "inline-flex items-center rounded-md p-2 text-sm font-medium")}
            >
              <item.Icon aria-hidden="true" className="size-6" />
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel>
          </Disclosure>);}