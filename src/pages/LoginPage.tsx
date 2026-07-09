import { useEffect, useState, type SubmitEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/PasswordInput'
import logo from '@/assets/logo.svg'

export default function LoginPage() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (session) navigate(from, { replace: true })
  }, [session, from, navigate])

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const message = await signIn(email, password)
    setSubmitting(false)
    if (message) setError(message)
  }

  return (
    <div className="grid min-h-svh items-center px-8 pb-24">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="そういえば" className="h-8" />
          <p className="text-sm text-muted-foreground">
            "そういえば、あれ買わなきゃ"をみんなで共有
          </p>
        </div>
        <h1 className="text-center text-xl font-bold">ログイン</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password">パスワード</Label>
              <PasswordInput
                id="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-sm text-muted-foreground">
              <Link
                to="/forgot-password"
                className="text-foreground underline underline-offset-4"
              >
                パスワードをお忘れですか？
              </Link>
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || !email || !password}
            >
              {submitting ? 'ログイン中…' : 'ログイン'}
            </Button>
            <p className="text-sm text-muted-foreground">
              アカウントがない場合は{' '}
              <Link
                to="/signup"
                state={{ from }}
                className="text-foreground underline underline-offset-4"
              >
                新規登録
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
