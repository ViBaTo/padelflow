import { Outlet } from 'react-router-dom'
import { SidebarProvider, Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout() {
  return (
    <SidebarProvider>
      <div className='min-h-screen flex w-full bg-gray-50 min-w-0'>
        <Sidebar />
        <main className='flex-1 flex flex-col min-w-0'>
          <Header />
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}
