import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/PasswordInput'
import logo from '@/assets/logo.svg'

export default function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const message = await updatePassword(password)
    setSubmitting(false)
    if (message) {
      setError(message)
    } else {
      navigate('/', { replace: true })
    }
  }

  if (loading) return null

  return (
    <div className="grid min-h-svh items-center px-8 pb-16">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="flex flex-col items-center gap-6">
          <img src={logo} alt="そういえば" className="h-4" />
          <h1 className="text-center text-xl font-bold">
            新しいパスワードの設定
          </h1>
        </div>
        {session ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="password">新しいパスワード</Label>
                <PasswordInput
                  id="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? '設定中…' : 'パスワードを設定'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <p>リンクが無効か、期限切れです。</p>
            <p className="text-sm text-muted-foreground">
              <Link
                to="/forgot-password"
                className="text-foreground underline underline-offset-4"
              >
                再設定メールを再送する
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
