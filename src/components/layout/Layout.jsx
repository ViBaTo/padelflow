import { Outlet } from 'react-router-dom'
import { SidebarProvider, Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout() {
  return (
    <SidebarProvider>
      <div className='min-h-screen flex w-full bg-gray-50'>
        <Sidebar />
        <main className='flex-1 flex flex-col'>
          <Header />

          <div className='flex-1 p-6'>
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
