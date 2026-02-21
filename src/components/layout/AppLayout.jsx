import { Outlet } from 'react-router-dom'
import { NotificationContainer } from '../common'
import { Header } from './Header'

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-studio-bg">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>
      <NotificationContainer />
    </div>
  )
}
