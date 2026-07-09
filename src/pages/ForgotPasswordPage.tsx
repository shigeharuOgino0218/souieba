import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import logo from '@/assets/logo.svg'

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const message = await resetPasswordForEmail(email)
    setSubmitting(false)
    if (message) {
      setError(message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="grid min-h-svh items-center px-8 pb-16">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="flex flex-col items-center gap-6">
          <img src={logo} alt="そういえば" className="h-4" />
          <h1 className="text-center text-xl font-bold">
            パスワードの再設定
          </h1>
        </div>
        <div className="space-y-6">
          {sent ? (
            <p className="text-sm text-center">
              再設定メールを送信しました。
              <br />
              メール内のリンクからパスワードを設定してください。
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-8">
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
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? '送信中…' : '再設定メールを送信'}
              </Button>
            </form>
          )}
          <p className="text-sm text-muted-foreground text-center">
            <Link
              to="/login"
              className="text-foreground underline underline-offset-4"
            >
              ログインに戻る
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
