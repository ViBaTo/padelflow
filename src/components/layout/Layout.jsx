import { Outlet } from 'react-router-dom'
import { SidebarProvider, Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout() {
  return (
    <SidebarProvider>
      <div className='h-screen flex w-full bg-gray-50 min-w-0'>
        <Sidebar />
        <main className='flex-1 flex flex-col min-w-0 h-full'>
          <Header />
          <div className='flex-1 overflow-y-auto min-h-0'>
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
