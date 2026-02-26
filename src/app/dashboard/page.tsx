import Link from 'next/link'

// Mock data for now
const mockProjects = [
  { id: '1', name: 'My App', domain: 'myapp.com', tasks_count: 3 },
  { id: '2', name: 'Landing Page', domain: 'landing.com', tasks_count: 1 },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">🛤️ OnTheWay</Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">zoe@example.com</span>
            <button className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Link 
            href="/dashboard/projects/new" 
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            + New Project
          </Link>
        </div>

        {/* Projects grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map(project => (
            <Link 
              key={project.id} 
              href={`/dashboard/projects/${project.id}`}
              className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-lg font-semibold mb-2">{project.name}</h2>
              <p className="text-gray-500 text-sm mb-4">{project.domain}</p>
              <div className="flex justify-between text-sm">
                <span>{project.tasks_count} tasks</span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
          ))}

          {/* Empty state / Add new */}
          <Link 
            href="/dashboard/projects/new"
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center justify-center hover:border-gray-400 transition-colors"
          >
            <span className="text-gray-500">+ Add Project</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
