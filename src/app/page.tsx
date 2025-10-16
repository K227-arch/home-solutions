// Home page without framework branding

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-3xl font-bold text-high-contrast text-center sm:text-left">Welcome</h1>
        <p className="mt-2 text-readable text-center sm:text-left">
          Choose an option below to continue.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <a href="/login" className="block text-center py-3 px-4 rounded-md border border-gray-300 hover:border-blue-500 hover:text-blue-600">Log In</a>
          <a href="/signup" className="block text-center py-3 px-4 rounded-md border border-gray-300 hover:border-blue-500 hover:text-blue-600">Sign Up</a>
        </div>
      </main>
      {/* Footer removed to eliminate framework branding */}
    </div>
  );
}
