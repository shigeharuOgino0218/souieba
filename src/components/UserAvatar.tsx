import { cn } from '@/lib/utils'
import { resolveAvatar } from '@/lib/avatars'

const sizeClasses = {
  sm: 'size-8 [&_svg]:size-4',
  md: 'size-10 [&_svg]:!size-5',
  lg: 'size-20 [&_svg]:size-10',
} as const

type Props = {
  icon?: string | null
  color?: string | null
  size?: keyof typeof sizeClasses
  className?: string
}

export function UserAvatar({ icon, color, size = 'md', className }: Props) {
  const { Icon, colorClass } = resolveAvatar(icon, color)
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        colorClass,
        sizeClasses[size],
        className,
      )}
    >
      <Icon />
    </span>
  )
}
