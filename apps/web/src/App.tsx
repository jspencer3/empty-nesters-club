import { BrowserRouter, Routes, Route } from 'react-router'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { Activities } from './pages/Activities'
import { Nests } from './pages/Nests'
import { Profile } from './pages/Profile'
import { UserProfile } from './pages/UserProfile'
import { PartnerGroups } from './pages/PartnerGroups'
import { Testimonials } from './pages/Testimonials'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="activities" element={<Activities />} />
            <Route path="nests" element={<Nests />} />
            <Route path="profile" element={<Profile />} />
            <Route path="users/:id" element={<UserProfile />} />
            <Route path="partner-groups" element={<PartnerGroups />} />
            <Route path="testimonials" element={<Testimonials />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
