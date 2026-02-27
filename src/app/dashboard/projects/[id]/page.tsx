import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProject, getTasks, getCurrentUser } from '@/lib/data'
import { InstallSnippet } from '@/components/InstallSnippet'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const project = await getProject(id)
  if (!project) redirect('/dashboard')

  let tasks: Awaited<ReturnType<typeof getTasks>> = []
  try {
    tasks = await getTasks(id)
  } catch {
    // DB error
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/dashboard" className="text-lg sm:text-xl font-bold shrink-0">🛤️</Link>
            <span className="text-gray-300 hidden sm:inline">/</span>
            <span className="font-medium truncate text-sm sm:text-base">{project.name}</span>
          </div>
          <Link href={`/dashboard/projects/${id}/settings`} className="text-sm text-gray-500 hover:text-gray-700 shrink-0">
            Settings
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Project info */}
        <div className="bg-white rounded-lg border p-4 sm:p-6 mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{project.name}</h1>
          <p className="text-gray-500 text-sm sm:text-base mb-4">{project.domain || 'No domain set'}</p>

          {/* API Key */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">API Key</span>
            </div>
            <code className="text-xs sm:text-sm break-all select-all">{project.api_key}</code>
          </div>

          {/* Installation */}
          <InstallSnippet projectId={project.id} />
        </div>

        {/* Tasks */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold">Tasks ({tasks.length})</h2>
          <Link
            href={`/dashboard/projects/${id}/tasks/new`}
            className="bg-black text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-800 text-sm"
          >
            + New Task
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            <p className="mb-4">No tasks yet. Create your first onboarding task.</p>
            <Link
              href={`/dashboard/projects/${id}/tasks/new`}
              className="text-blue-600 hover:text-blue-700"
            >
              + Create Task
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="sm:hidden space-y-3">
              {tasks.map(task => (
                <Link
                  key={task.id}
                  href={`/dashboard/projects/${id}/tasks/${task.id}`}
                  className="block bg-white rounded-lg border p-4 active:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{task.name}</div>
                      <div className="text-xs text-gray-500">{task.slug}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded shrink-0 ml-2 ${
                      task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {task.enabled ? 'Active' : 'Off'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 rounded">{task.trigger}</span>
                    <span>{Array.isArray(task.steps) ? task.steps.length : 0} steps</span>
                    <span className="ml-auto text-blue-600">Edit →</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-500">Trigger</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-500">Steps</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                      <th className="px-4 sm:px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-medium">{task.name}</div>
                          <div className="text-sm text-gray-500">{task.slug}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="text-sm px-2 py-1 bg-gray-100 rounded">{task.trigger}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-gray-600">
                          {Array.isArray(task.steps) ? task.steps.length : 0} steps
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`text-sm px-2 py-1 rounded ${
                            task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {task.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/projects/${id}/tasks/${task.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Edit →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
