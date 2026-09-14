import Link from "next/link";

export default function Home() {
  return (
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
  );
}
