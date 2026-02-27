import { redirect } from 'next/navigation'
import { getProject, getCurrentUser } from '@/lib/data'
import ProjectSettings from './settings'

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const project = await getProject(id)
  if (!project) redirect('/dashboard')

  return <ProjectSettings project={project} />
}
