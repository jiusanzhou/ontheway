import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">🛤️ OnTheWay</h1>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/docs" className="hover:underline">Docs</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Product Tours<br />Made Simple
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Record, customize, and deploy interactive onboarding flows in minutes.
            No code required.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/dashboard" 
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
            >
              Get Started
            </Link>
            <Link 
              href="/demo" 
              className="border px-6 py-3 rounded-lg hover:bg-gray-50"
            >
              Live Demo
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">How it works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="font-bold mb-2">Record</h4>
              <p className="text-gray-600">Click through your app to record steps</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✏️</div>
              <h4 className="font-bold mb-2">Customize</h4>
              <p className="text-gray-600">Add titles, descriptions, and styling</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h4 className="font-bold mb-2">Deploy</h4>
              <p className="text-gray-600">One line of code to activate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>Built by <a href="https://zoe.im" className="underline">Zoe</a></p>
        </div>
      </footer>
    </div>
  )
}
