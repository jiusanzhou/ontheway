import { redirect } from 'next/navigation'
import { getTask, getProject, getCurrentUser } from '@/lib/data'
import TaskEditor from './editor'

export default async function TaskEditorPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id, taskId } = await params
  const project = await getProject(id)
  if (!project) redirect('/dashboard')

  const task = await getTask(taskId)
  if (!task || task.project_id !== id) redirect(`/dashboard/projects/${id}`)

  return <TaskEditor projectId={id} task={task} />
}
