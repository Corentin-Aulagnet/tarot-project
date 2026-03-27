 import Link from "next/link";
 import "@/app/globals.css";
 export function NavBar() {
  return (
    <nav className="flex gap-4 p-4 bg-green-800 text-white">
      <Link className="hover:bg-green-500 transition active:{bg-white text-green-800}" href="/">Home</Link>
      <Link className="hover:bg-green-500 transition" href="/games/new">New Game</Link>
      <Link className="hover:bg-green-500 transition" href="/players/new">New Player</Link>
    </nav>);}