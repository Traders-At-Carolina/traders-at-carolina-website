import { Link } from 'react-router-dom'
import { PageMeta } from '../components/ui'

export function NotFoundPage() {
  return (
    <section className="not-found-page">
      <PageMeta title="Page not found" description="The requested Traders at Carolina page could not be found." />
      <div className="container">
        <span>404</span>
        <h1>This page moved outside the model.</h1>
        <p>The route you requested does not exist.</p>
        <Link className="button" to="/">Return home</Link>
      </div>
    </section>
  )
}
