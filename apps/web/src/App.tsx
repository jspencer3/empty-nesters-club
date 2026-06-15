import { BrowserRouter, Routes, Route } from 'react-router'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
