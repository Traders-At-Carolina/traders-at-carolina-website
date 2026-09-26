import { LockKeyhole } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../components/ui'

export function LoginPage() {
  return (
    <>
      <PageMeta
        title="Member Login"
        description="The future secure entry point for Traders at Carolina members and authorized administrators."
      />
      <section className="login-page">
        <div className="login-panel">
          <div className="login-icon"><LockKeyhole aria-hidden="true" /></div>
          <h1>Member access is being prepared.</h1>
          <p>
            This route will become the single secure entry point for members. Authorized administrators will be routed
            to admin tools after authentication; there will be no separate public admin login.
          </p>
          <div className="login-status" role="status">
            <strong>Authentication is not connected</strong>
            <span>No credentials are collected by this prototype.</span>
          </div>
          <Link className="button" to="/">Return home</Link>
        </div>
      </section>
    </>
  )
}
