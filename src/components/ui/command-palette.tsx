import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { Command as CommandPrimitive } from 'cmdk'
import { useCallback, useEffect, useState } from 'react'

interface CommandAction {
  id: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string[]
  onSelect: () => void
  category?: 'navigation' | 'device' | 'scene' | 'other'
}

interface CommandPaletteProps {
  actions: CommandAction[]
  onClose?: () => void
}

/**
 * Command Palette Component
 *
 * Keyboard-first command launcher with Cmd+K trigger.
 * Fuzzy search across all available actions.
 *
 * Features:
 * - Cmd+K / Ctrl+K to open
 * - Fuzzy search across all actions
 * - Keyboard navigation (arrow keys, enter)
 * - Category grouping
 * - Visual keyboard shortcuts
 * - Animated transitions
 *
 * @example
 * <CommandPalette
 *   actions={[
 *     {
 *       id: 'dashboard',
 *       label: 'Go to Dashboard',
 *       icon: HomeIcon,
 *       shortcut: ['⌘', 'D'],
 *       onSelect: () => navigate('/dashboard'),
 *       category: 'navigation',
 *     },
 *   ]}
 * />
 */
export function CommandPalette({ actions, onClose }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Open/close handlers
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen)
      if (!isOpen) {
        setSearch('')
        onClose?.()
      }
    },
    [onClose]
  )

  // Keyboard shortcut to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handleOpenChange(true)
      }

      // Escape to close
      if (e.key === 'Escape' && open) {
        handleOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, handleOpenChange])

  // Group actions by category
  const groupedActions = actions.reduce(
    (acc, action) => {
      const category = action.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(action)
      return acc
    },
    {} as Record<string, CommandAction[]>
  )

  const categoryLabels = {
    navigation: 'Navigation',
    device: 'Devices',
    scene: 'Scenes',
    other: 'Other',
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        className="bg-background/50 text-muted-foreground hover:bg-background relative flex items-center gap-2 px-3"
        onClick={() => handleOpenChange(true)}
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="bg-muted pointer-events-none ml-2 hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command Palette Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-0 p-0 sm:max-w-[550px]">
          <DialogHeader className="sr-only">
            <DialogTitle>Command Palette</DialogTitle>
            <DialogDescription>Quick navigation and actions</DialogDescription>
          </DialogHeader>

          <CommandPrimitive className="flex h-full flex-col overflow-hidden rounded-md">
            {/* Search Input */}
            <div className="flex items-center border-b px-3">
              <SearchIcon className="text-muted-foreground mr-2 h-4 w-4 shrink-0" />
              <CommandPrimitive.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Type a command or search..."
                className="placeholder:text-muted-foreground flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Results */}
            <CommandPrimitive.List className="max-h-[400px] overflow-x-hidden overflow-y-auto p-2">
              <CommandPrimitive.Empty className="py-6 text-center text-sm">
                No results found.
              </CommandPrimitive.Empty>

              {Object.entries(groupedActions).map(([category, categoryActions]) => (
                <CommandPrimitive.Group
                  key={category}
                  heading={categoryLabels[category as keyof typeof categoryLabels]}
                  className="text-muted-foreground overflow-hidden px-2 py-2 text-xs font-semibold"
                >
                  {categoryActions.map(action => {
                    const Icon = action.icon
                    return (
                      <CommandPrimitive.Item
                        key={action.id}
                        value={action.label}
                        onSelect={() => {
                          action.onSelect()
                          handleOpenChange(false)
                        }}
                        className={cn(
                          'aria-selected:bg-accent aria-selected:text-accent-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2.5 text-sm transition-colors outline-none select-none',
                          'hover:bg-accent/50'
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4 shrink-0" />}
                        <div className="flex-1">
                          <div className="font-medium">{action.label}</div>
                          {action.description && (
                            <div className="text-muted-foreground text-xs">
                              {action.description}
                            </div>
                          )}
                        </div>
                        {action.shortcut && (
                          <div className="ml-auto flex gap-0.5">
                            {action.shortcut.map((key, i) => (
                              <kbd
                                key={i}
                                className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:inline-flex"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </CommandPrimitive.Item>
                    )
                  })}
                </CommandPrimitive.Group>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * useKeyboardShortcut Hook
 *
 * Registers global keyboard shortcuts with automatic cleanup.
 *
 * @example
 * useKeyboardShortcut('d', () => navigateTo('/dashboard'), { meta: true })
 * useKeyboardShortcut('r', () => refreshData(), { ctrl: true })
 */
interface ShortcutOptions {
  meta?: boolean // Cmd on Mac, Ctrl on Windows/Linux
  ctrl?: boolean // Ctrl key explicitly
  shift?: boolean // Shift key
  alt?: boolean // Alt/Option key
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {}
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check modifiers
      const metaMatch = !options.meta || e.metaKey || e.ctrlKey
      const ctrlMatch = !options.ctrl || e.ctrlKey
      const shiftMatch = !options.shift || e.shiftKey
      const altMatch = !options.alt || e.altKey

      // Check key match
      const keyMatch = e.key.toLowerCase() === key.toLowerCase()

      // Execute if all conditions met
      if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, options])
}
