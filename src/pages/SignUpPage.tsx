import { useEffect, useState, type SubmitEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/PasswordInput'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SignUpPage() {
  const { session, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  useEffect(() => {
    if (session) navigate(from, { replace: true })
  }, [session, from, navigate])

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await signUp(email, password, displayName || email.split('@')[0])
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.needsEmailConfirmation) setConfirmationSent(true)
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>確認メールを送信しました</CardTitle>
            <CardDescription>
              {email} 宛のメール内のリンクを開いて登録を完了してください。
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              render={<Link to="/login" state={{ from }} />}
            >
              ログイン画面へ
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>新規登録</CardTitle>
          <CardDescription>アカウントを作成して買い物リストを共有</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">表示名(任意)</Label>
              <Input
                id="displayName"
                placeholder="例: たろう"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <PasswordInput
                id="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? '登録中…' : '登録する'}
            </Button>
            <p className="text-sm text-muted-foreground">
              すでにアカウントがある場合は{' '}
              <Link
                to="/login"
                state={{ from }}
                className="text-foreground underline underline-offset-4"
              >
                ログイン
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
