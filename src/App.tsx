import { Route, Routes } from 'react-router-dom'
import { SiteLayout } from './components/SiteLayout'
import { AboutPage } from './pages/AboutPage'
import { EventsPage } from './pages/EventsPage'
import { HomePage } from './pages/HomePage'
import { JoinPage } from './pages/JoinPage'
import { LoginPage } from './pages/LoginPage'
import { MembersPage } from './pages/MembersPage'
import { MembershipPage } from './pages/MembershipPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PartnersPage } from './pages/PartnersPage'
import { SponsorsPage } from './pages/SponsorsPage'

export default function App() {
  return (
    <SiteLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteLayout>
  )
}
