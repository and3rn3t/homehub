import { useHaptic } from '@/hooks/use-haptic'
import { useKV } from '@/hooks/use-kv'
import { StarIcon } from '@/lib/icons'
import { motion } from 'framer-motion'
import { useCallback } from 'react'
import { toast } from 'sonner'

interface FavoriteButtonProps {
  deviceId: string
  deviceName: string
  isFavorite: boolean
  size?: number
  className?: string
}

export function FavoriteButton({
  deviceId,
  deviceName,
  isFavorite,
  size = 20,
  className = '',
}: FavoriteButtonProps) {
  const [, setFavoriteDevices] = useKV<string[]>('favorite-devices', [])
  const haptic = useHaptic()

  const toggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation() // Prevent triggering parent onClick

      // Haptic feedback - light for add, medium for remove
      if (isFavorite) {
        haptic.medium()
      } else {
        haptic.light()
      }

      if (isFavorite) {
        // Remove from favorites
        setFavoriteDevices(prev => prev.filter(id => id !== deviceId))
        toast.success(`Removed ${deviceName} from favorites`, {
          duration: 2000,
        })
      } else {
        // Add to favorites
        setFavoriteDevices(prev => [...prev, deviceId])
        toast.success(`Added ${deviceName} to favorites`, {
          duration: 2000,
        })
      }
    },
    [deviceId, deviceName, isFavorite, setFavoriteDevices, haptic]
  )

  return (
    <motion.button
      type="button"
      onClick={toggleFavorite}
      className={`hover:bg-accent inline-flex items-center justify-center rounded-full p-2 transition-colors ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <motion.div
        initial={false}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
      >
        <StarIcon
          className={`${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'} ${size === 20 ? 'h-5 w-5' : size === 16 ? 'h-4 w-4' : 'h-6 w-6'}`}
        />
      </motion.div>
    </motion.button>
  )
}
