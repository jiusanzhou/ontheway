import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProjects, getCurrentUser, getUserPlan } from '@/lib/data'
import { DashboardOnboarding, ReplayOnboardingButton, HelpFloatingMenu } from '@/components/DashboardOnboarding'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  let projects: Awaited<ReturnType<typeof getProjects>> = []
  let plan: 'free' | 'pro' | 'enterprise' = 'free'
  try {
    projects = await getProjects()
  } catch {
    // DB not connected yet, show empty state
  }
  try {
    plan = await getUserPlan(user.id)
  } catch {
    // Default to free
  }

  return (
    <div className="min-h-screen theme-bg-page">
      {/* Onboarding tour for new users */}
      <DashboardOnboarding />
      <HelpFloatingMenu />

      <header className="theme-bg-primary border-b theme-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <Link href="/" id="otw-logo" className="text-lg sm:text-xl font-bold flex items-center gap-2 theme-text-primary">
            <img src="/logo.svg" alt="OnTheWay" className="w-7 h-7" />
            <span>OnTheWay</span>
          </Link>
          <div id="otw-user-menu" className="flex items-center gap-2 sm:gap-4">
            <ThemeSwitcher />
            <span className="theme-text-secondary text-sm hidden sm:inline">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm theme-text-tertiary hover:theme-text-primary transition-colors">Logout</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold theme-text-primary">Projects</h1>
          <Link
            id="otw-new-project"
            href="/dashboard/projects/new"
            className="theme-accent px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base transition-colors"
          >
            + New Project
          </Link>
        </div>

        <div id="otw-projects-grid" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="theme-bg-primary rounded-lg border theme-border p-4 sm:p-6 hover:theme-shadow-lg transition-shadow"
            >
              <h2 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 theme-text-primary">{project.name}</h2>
              <p className="theme-text-tertiary text-sm mb-3 sm:mb-4">{project.domain || 'No domain'}</p>
              <div className="flex justify-between text-sm">
                <span className="theme-text-tertiary text-xs">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
                <span className="theme-text-tertiary">→</span>
              </div>
            </Link>
          ))}

          <Link
            id="otw-add-project"
            href="/dashboard/projects/new"
            className="border-2 border-dashed rounded-lg p-4 sm:p-6 flex items-center justify-center transition-colors min-h-[100px]"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="theme-text-secondary">+ Add Project</span>
          </Link>
        </div>

        {/* Footer with replay button */}
        <div className="mt-12 text-center">
          <ReplayOnboardingButton />
        </div>

        {/* Upgrade banner for free plan users */}
        {plan === 'free' && (
          <div className="mt-8 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: 'linear-gradient(to right, var(--accent), var(--accent-hover))', color: 'var(--accent-text)' }}>
            <div>
              <h3 className="font-bold text-lg mb-1">Upgrade to Pro</h3>
              <p className="opacity-80 text-sm">
                Unlock unlimited projects, tasks, 50K views/mo, analytics & custom branding.
              </p>
            </div>
            <a
              href="/api/payment/checkout"
              className="shrink-0 theme-bg-primary theme-text-primary px-6 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm font-medium"
            >
              Upgrade — $19/mo
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
