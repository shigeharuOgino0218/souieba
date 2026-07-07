import { useEffect, useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useMyProfile } from '@/hooks/useMyProfile'
import {
  AVATAR_COLORS,
  AVATAR_ICONS,
  DEFAULT_AVATAR_COLOR,
  DEFAULT_AVATAR_ICON,
} from '@/lib/avatars'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserAvatar } from '@/components/UserAvatar'

export default function SettingsPage() {
  const { session } = useAuth()
  const { profile, loading, refresh } = useMyProfile()
  const [displayName, setDisplayName] = useState('')
  const [avatarIcon, setAvatarIcon] = useState(DEFAULT_AVATAR_ICON)
  const [avatarColor, setAvatarColor] = useState(DEFAULT_AVATAR_COLOR)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name)
    setAvatarIcon(profile.avatar_icon || DEFAULT_AVATAR_ICON)
    setAvatarColor(profile.avatar_color || DEFAULT_AVATAR_COLOR)
  }, [profile])

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!session) return
    const name = displayName.trim()
    if (!name) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: name,
        avatar_icon: avatarIcon,
        avatar_color: avatarColor,
      })
      .eq('id', session.user.id)
    setSaving(false)
    if (error) {
      toast.error('保存に失敗しました')
      return
    }
    toast.success('プロフィールを保存しました')
    void refresh()
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-4 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="/" aria-label="リスト一覧へ戻る">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">アカウント設定</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
          <CardDescription>{session?.user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="mx-auto size-16 rounded-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center">
                <UserAvatar icon={avatarIcon} color={avatarColor} size="lg" />
              </div>

              <div className="space-y-2">
                <Label>アイコン</Label>
                <div className="grid grid-cols-8 gap-2">
                  {Object.entries(AVATAR_ICONS).map(([key, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      aria-label={key}
                      aria-pressed={avatarIcon === key}
                      onClick={() => setAvatarIcon(key)}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-full border text-muted-foreground hover:bg-muted',
                        avatarIcon === key &&
                          'border-primary text-foreground ring-2 ring-primary/40',
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>カラー</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(AVATAR_COLORS).map(([key, color]) => (
                    <button
                      key={key}
                      type="button"
                      aria-label={key}
                      aria-pressed={avatarColor === key}
                      onClick={() => setAvatarColor(key)}
                      className={cn(
                        'size-8 rounded-full',
                        color.bg,
                        avatarColor === key &&
                          'ring-2 ring-primary ring-offset-2 ring-offset-background',
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">ユーザー名</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  共有リストのメンバー一覧に表示される名前です。
                </p>
              </div>

              <Button type="submit" disabled={saving || displayName.trim() === ''}>
                {saving ? '保存中…' : '保存'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
