import {
  Bird,
  Cat,
  Coffee,
  Dog,
  Fish,
  Flower2,
  Ghost,
  Heart,
  Pizza,
  Rabbit,
  Rocket,
  Squirrel,
  Star,
  Sun,
  Turtle,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export const AVATAR_ICONS: Record<string, LucideIcon> = {
  'user-round': UserRound,
  cat: Cat,
  dog: Dog,
  bird: Bird,
  rabbit: Rabbit,
  fish: Fish,
  turtle: Turtle,
  squirrel: Squirrel,
  ghost: Ghost,
  rocket: Rocket,
  star: Star,
  heart: Heart,
  flower: Flower2,
  sun: Sun,
  coffee: Coffee,
  pizza: Pizza,
}

export const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  stone: { bg: 'bg-stone-200', text: 'text-stone-700' },
  red: { bg: 'bg-red-200', text: 'text-red-700' },
  orange: { bg: 'bg-orange-200', text: 'text-orange-700' },
  amber: { bg: 'bg-amber-200', text: 'text-amber-700' },
  green: { bg: 'bg-green-200', text: 'text-green-700' },
  teal: { bg: 'bg-teal-200', text: 'text-teal-700' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-700' },
  purple: { bg: 'bg-purple-200', text: 'text-purple-700' },
  pink: { bg: 'bg-pink-200', text: 'text-pink-700' },
}

export const DEFAULT_AVATAR_ICON = 'user-round'
export const DEFAULT_AVATAR_COLOR = 'stone'

export function resolveAvatar(icon?: string | null, color?: string | null) {
  const Icon = AVATAR_ICONS[icon ?? ''] ?? AVATAR_ICONS[DEFAULT_AVATAR_ICON]
  const c = AVATAR_COLORS[color ?? ''] ?? AVATAR_COLORS[DEFAULT_AVATAR_COLOR]
  return { Icon, colorClass: `${c.bg} ${c.text}` }
}
