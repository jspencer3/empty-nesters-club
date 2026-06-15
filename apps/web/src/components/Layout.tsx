import { Outlet } from 'react-router'

export function Layout() {
  return (
    <div>
      <header>
        <h1>Empty Nesters Club</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
