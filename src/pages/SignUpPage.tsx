import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import logo from "@/assets/logo.svg";

export default function SignUpPage() {
  const { session, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, from, navigate]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signUp(
      email,
      password,
      displayName || email.split("@")[0],
    );
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) setConfirmationSent(true);
  };

  if (confirmationSent) {
    return (
      <div className="grid min-h-svh items-center px-8 pb-24">
        <div className="w-full max-w-sm mx-auto space-y-6 text-center">
          <h1 className="text-xl font-bold">確認メールを送信しました</h1>
          <p className="text-sm text-muted-foreground">
            {email || "test.example@example.com"} 宛に
            <br />
            確認メールを送信しました。
            <br />
            メール内のリンクを開いて登録を完了してください。
          </p>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            render={<Link to="/login" state={{ from }} />}
          >
            ログイン画面へ
          </Button>
        </div>
      </div>
    );
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
        <h1 className="text-center text-xl font-bold">新規登録</h1>
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
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="displayName">表示名(任意)</Label>
              <Input
                id="displayName"
                placeholder="例: たろう"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex flex-col gap-6">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || !email || !password}
            >
              {submitting ? "登録中…" : "登録する"}
            </Button>
            <p className="text-sm text-muted-foreground">
              すでにアカウントがある場合は{" "}
              <Link
                to="/login"
                state={{ from }}
                className="text-foreground underline underline-offset-4"
              >
                ログイン
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
