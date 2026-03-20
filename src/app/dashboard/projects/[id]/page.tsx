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
    <div className="min-h-screen theme-bg-page">
      <header className="theme-bg-primary border-b theme-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/dashboard" className="text-lg sm:text-xl font-bold shrink-0">
              <img src="/logo.svg" alt="OnTheWay" className="w-7 h-7" />
            </Link>
            <span className="theme-text-tertiary hidden sm:inline">/</span>
            <span className="font-medium truncate text-sm sm:text-base theme-text-primary">{project.name}</span>
          </div>
          <Link href={`/dashboard/projects/${id}/settings`} className="text-sm theme-text-secondary hover:theme-text-primary transition-colors shrink-0">
            Settings
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Project info */}
        <div className="theme-bg-primary rounded-lg border theme-border p-4 sm:p-6 mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 theme-text-primary">{project.name}</h1>
          <p className="theme-text-secondary text-sm sm:text-base mb-4">{project.domain || 'No domain set'}</p>

          {/* API Key */}
          <div className="theme-bg-secondary rounded-lg p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium theme-text-primary">API Key</span>
            </div>
            <code className="text-xs sm:text-sm break-all select-all theme-text-secondary">{project.api_key}</code>
          </div>

          {/* Installation */}
          <InstallSnippet projectId={project.id} />
        </div>

        {/* Tasks */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold theme-text-primary">Tasks ({tasks.length})</h2>
          <Link
            href={`/dashboard/projects/${id}/tasks/new`}
            className="theme-accent px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + New Task
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="theme-bg-primary rounded-lg border theme-border p-8 text-center theme-text-secondary">
            <p className="mb-4">No tasks yet. Create your first onboarding task.</p>
            <Link
              href={`/dashboard/projects/${id}/tasks/new`}
              className="theme-link"
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
                  className="block theme-bg-primary rounded-lg border theme-border p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate theme-text-primary">{task.name}</div>
                      <div className="text-xs theme-text-secondary">{task.slug}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded shrink-0 ml-2 ${
                      task.enabled ? 'theme-success' : 'theme-badge'
                    }`}>
                      {task.enabled ? 'Active' : 'Off'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs theme-text-secondary">
                    <span className="px-2 py-0.5 theme-badge rounded">{task.trigger}</span>
                    <span>{Array.isArray(task.steps) ? task.steps.length : 0} steps</span>
                    <span className="ml-auto theme-link">Edit →</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block theme-bg-primary rounded-lg border theme-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="theme-bg-secondary border-b theme-border">
                    <tr>
                      <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium theme-text-secondary">Name</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium theme-text-secondary">Trigger</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium theme-text-secondary">Steps</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-sm font-medium theme-text-secondary">Status</th>
                      <th className="px-4 sm:px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-b theme-border last:border-0 hover:theme-bg-secondary transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-medium theme-text-primary">{task.name}</div>
                          <div className="text-sm theme-text-secondary">{task.slug}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="text-sm px-2 py-1 theme-badge rounded">{task.trigger}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 theme-text-secondary">
                          {Array.isArray(task.steps) ? task.steps.length : 0} steps
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`text-sm px-2 py-1 rounded ${
                            task.enabled ? 'theme-success' : 'theme-badge'
                          }`}>
                            {task.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/projects/${id}/tasks/${task.id}`}
                            className="theme-link text-sm"
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
