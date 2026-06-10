import appIcon from '@/assets/app-icon.png'

interface AppIconProps {
  size?: number
  className?: string
  alt?: string
}

export default function AppIcon({ size = 32, className = '', alt = '' }: AppIconProps) {
  return (
    <img
      src={appIcon}
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 rounded-[22%] ${className}`}
      draggable={false}
    />
  )
}
