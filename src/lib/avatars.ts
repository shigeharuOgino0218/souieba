import {
  Bird,
  Cat,
  Citrus,
  Coffee,
  Crown,
  Dog,
  Fish,
  Flower2,
  Gem,
  Ghost,
  Hamburger,
  Heart,
  Panda,
  Pizza,
  Rabbit,
  Rat,
  Rocket,
  Shrimp,
  Squirrel,
  Star,
  Swords,
  Turtle,
  UserRound,
  Volleyball,
  type LucideIcon,
} from 'lucide-react'

export const AVATAR_ICONS: Record<string, LucideIcon> = {
  'user-round': UserRound,
  cat: Cat,
  dog: Dog,
  bird: Bird,
  fish: Fish,
  panda: Panda,
  rabbit: Rabbit,
  rat: Rat,
  shrimp: Shrimp,
  squirrel: Squirrel,
  turtle: Turtle,
  flower: Flower2,
  ghost: Ghost,
  citrus: Citrus,
  hamburger: Hamburger,
  pizza: Pizza,
  coffee: Coffee,
  crown: Crown,
  gem: Gem,
  swords: Swords,
  heart: Heart,
  star: Star,
  volleyball: Volleyball,
  rocket: Rocket,
}

export const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  slate: { bg: 'bg-slate-200', text: 'text-slate-800' },
  red: { bg: 'bg-red-200', text: 'text-red-800' },
  amber: { bg: 'bg-amber-200', text: 'text-amber-800' },
  lime: { bg: 'bg-lime-200', text: 'text-lime-800' },
  emerald: { bg: 'bg-emerald-200', text: 'text-emerald-800' },
  cyan: { bg: 'bg-cyan-200', text: 'text-cyan-800' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-800' },
  violet: { bg: 'bg-violet-200', text: 'text-violet-800' },
  fuchsia: { bg: 'bg-fuchsia-200', text: 'text-fuchsia-800' },
}

export const DEFAULT_AVATAR_ICON = 'user-round'
export const DEFAULT_AVATAR_COLOR = 'slate'

export function resolveAvatar(icon?: string | null, color?: string | null) {
  const Icon = AVATAR_ICONS[icon ?? ''] ?? AVATAR_ICONS[DEFAULT_AVATAR_ICON]
  const c = AVATAR_COLORS[color ?? ''] ?? AVATAR_COLORS[DEFAULT_AVATAR_COLOR]
  return { Icon, colorClass: `${c.bg} ${c.text}` }
}
