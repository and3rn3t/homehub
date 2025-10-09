interface ActivityBarProps {
  deviceCount: number
  maxCount?: number
  label: string
}

/**
 * ActivityBar component for visualizing hourly device activity
 * Uses CSS Grid and flexbox for dynamic sizing without inline styles
 */
export function ActivityBar({ deviceCount, maxCount = 25, label }: ActivityBarProps) {
  // Calculate height as a fraction (0-1) for grid template rows
  const heightFraction = Math.min(deviceCount / maxCount, 1)

  // Create multiple divs for discrete height levels (20 levels)
  const level = Math.round(heightFraction * 20)

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-1 flex h-[60px] w-full items-end justify-center">
        <div className={`activity-bar w-full activity-bar-level-${level}`} />
      </div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  )
}
