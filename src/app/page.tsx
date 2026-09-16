import { MapPin } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-between border-b border-zinc-200/70 bg-white/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900">
          <MapPin size={20} className="text-black" strokeWidth={2.5} />
          <span>Geomap</span>
        </div>
        <Link
          href="/login"
          className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Log in
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Geomap</h1>
        <p className="max-w-md text-zinc-500">
          See where your friends are, right now. Nearby only, private by
          design.
        </p>
        <Link
          href="/login"
          className="rounded-full bg-black px-6 py-3 font-medium text-white hover:bg-zinc-800"
        >
          Log in
        </Link>
      </main>
    </>
  );
}
