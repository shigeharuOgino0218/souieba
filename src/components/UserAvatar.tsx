import { cn } from '@/lib/utils'
import { resolveAvatar } from '@/lib/avatars'

const sizeClasses = {
  sm: 'size-5 [&_svg]:size-3',
  md: 'size-7 [&_svg]:size-4',
  lg: 'size-16 [&_svg]:size-8',
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
