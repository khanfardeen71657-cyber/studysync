import { Link } from 'react-router-dom'
import Button from '../components/common/Button.jsx'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1
          className="text-[100px] font-extrabold tracking-[-0.05em] leading-none mb-4"
          style={{
            background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </h1>
        <p className="text-[18px] text-slate-400 mb-8">Page not found</p>
        <Link to="/">
          <Button variant="primary">Go home</Button>
        </Link>
      </div>
    </div>
  )
}