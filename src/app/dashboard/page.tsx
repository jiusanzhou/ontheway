import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProjects, getCurrentUser } from '@/lib/data'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  let projects: Awaited<ReturnType<typeof getProjects>> = []
  try {
    projects = await getProjects()
  } catch {
    // DB not connected yet, show empty state
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <Link href="/" className="text-lg sm:text-xl font-bold">🛤️ OnTheWay</Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-600 text-sm hidden sm:inline">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold">Projects</h1>
          <Link
            href="/dashboard/projects/new"
            className="bg-black text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-800 text-sm sm:text-base"
          >
            + New Project
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="bg-white rounded-lg border p-4 sm:p-6 hover:shadow-lg transition-shadow active:bg-gray-50"
            >
              <h2 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{project.name}</h2>
              <p className="text-gray-500 text-sm mb-3 sm:mb-4">{project.domain || 'No domain'}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 text-xs">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
          ))}

          <Link
            href="/dashboard/projects/new"
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 flex items-center justify-center hover:border-gray-400 transition-colors min-h-[100px]"
          >
            <span className="text-gray-500">+ Add Project</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
