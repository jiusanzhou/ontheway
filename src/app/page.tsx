import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold">🛤️ OnTheWay</h1>
          <nav className="flex gap-3 sm:gap-4 text-sm sm:text-base">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/docs" className="hover:underline">Docs</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center py-12 sm:py-0">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
            Product Tours<br />Made Simple
          </h2>
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 px-2">
            Record, customize, and deploy interactive onboarding flows in minutes.
            No code required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link 
              href="/dashboard" 
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 text-center"
            >
              Get Started
            </Link>
            <Link 
              href="/demo" 
              className="border px-6 py-3 rounded-lg hover:bg-gray-50 text-center"
            >
              Live Demo
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">How it works</h3>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎯</div>
              <h4 className="font-bold mb-2">Record</h4>
              <p className="text-gray-600 text-sm sm:text-base">Click through your app to record steps</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">✏️</div>
              <h4 className="font-bold mb-2">Customize</h4>
              <p className="text-gray-600 text-sm sm:text-base">Add titles, descriptions, and styling</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚀</div>
              <h4 className="font-bold mb-2">Deploy</h4>
              <p className="text-gray-600 text-base">One line of code to activate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600 text-sm sm:text-base">
          <p>Built by <a href="https://zoe.im" className="underline">Zoe</a></p>
        </div>
      </footer>
    </div>
  )
}
