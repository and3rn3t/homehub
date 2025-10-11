import { useKV } from '@/hooks/use-kv'
import { Star } from '@/lib/icons'
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

  const toggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation() // Prevent triggering parent onClick

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
    [deviceId, deviceName, isFavorite, setFavoriteDevices]
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
        <Star
          size={size}
          weight={isFavorite ? 'fill' : 'regular'}
          className={isFavorite ? 'text-yellow-500' : 'text-muted-foreground'}
        />
      </motion.div>
    </motion.button>
  )
}
