import { useContext } from 'react'
import { QueueCountContext } from './QueueCountContext'

export function useQueueCount() {
  const context = useContext(QueueCountContext)
  if (!context) throw new Error('useQueueCount doit être utilisé dans <QueueCountProvider>')
  return context
}
