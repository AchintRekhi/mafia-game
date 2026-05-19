export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-6xl tracking-wide text-mafia drop-shadow-[0_0_18px_rgba(185,28,28,0.5)]">
        MAFIA
      </h1>
      <p className="max-w-md text-stone-300">
        The narrator is the app. The roles are secret. The room is yours. Lobby coming in{' '}
        <code className="text-stone-100">feature/lobby</code>.
      </p>
    </main>
  );
}
