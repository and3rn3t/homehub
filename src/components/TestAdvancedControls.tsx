/**
 * Test Page for Advanced Hue Controls
 *
 * Isolated testing environment for ColorWheelPicker, BrightnessSlider,
 * and ColorTemperatureSlider components before integration.
 *
 * Usage: Import this component in App.tsx or navigate to test route
 */

import { Badge } from '@/components/ui/badge'
import { BrightnessSlider } from '@/components/ui/brightness-slider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorTemperatureSlider } from '@/components/ui/color-temperature-slider'
import { ColorWheelPicker } from '@/components/ui/color-wheel'
import { CheckCircleIcon, XCircleIcon } from '@/lib/icons'
import { useState } from 'react'
import { toast } from 'sonner'

export function TestAdvancedControls() {
  const [color, setColor] = useState('#FF5500')
  const [brightness, setBrightness] = useState(75)
  const [colorTemp, setColorTemp] = useState(3000)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    toast.success('Color changed', {
      description: newColor,
    })
  }

  const handleBrightnessChange = (newBrightness: number) => {
    setBrightness(newBrightness)
    if (newBrightness === 0 || newBrightness === 100) {
      toast.info(`Brightness at ${newBrightness}%`)
    }
  }

  const handleColorTempChange = (newTemp: number) => {
    setColorTemp(newTemp)
    if (newTemp === 2000 || newTemp === 6500) {
      toast.info(`Color temperature at ${newTemp}K`)
    }
  }

  const simulateLoading = () => {
    setIsUpdating(true)
    toast.loading('Updating device...')
    setTimeout(() => {
      setIsUpdating(false)
      toast.success('Device updated successfully!')
    }, 2000)
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Advanced Hue Controls Test</h1>
        <p className="text-muted-foreground text-lg">
          Testing ColorWheelPicker, BrightnessSlider, and ColorTemperatureSlider components
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>Toggle states to test component behavior</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button
            variant={isUpdating ? 'default' : 'outline'}
            onClick={() => setIsUpdating(!isUpdating)}
          >
            {isUpdating ? <CheckCircleIcon className="mr-2 h-4 w-4" /> : null}
            {isUpdating ? 'Loading Active' : 'Test Loading State'}
          </Button>
          <Button
            variant={isDisabled ? 'destructive' : 'outline'}
            onClick={() => setIsDisabled(!isDisabled)}
          >
            {isDisabled ? <XCircleIcon className="mr-2 h-4 w-4" /> : null}
            {isDisabled ? 'Disabled' : 'Enable Disabled State'}
          </Button>
          <Button variant="secondary" onClick={simulateLoading}>
            Simulate API Call
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setColor('#FF5500')
              setBrightness(75)
              setColorTemp(3000)
              toast.info('Values reset to defaults')
            }}
          >
            Reset Values
          </Button>
        </CardContent>
      </Card>

      {/* Live Values Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Values</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Color:</span>
            <Badge variant="outline" className="font-mono">
              {color}
            </Badge>
            <div
              className="border-border h-6 w-6 rounded border-2"
              style={{ backgroundColor: color }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Brightness:</span>
            <Badge variant="outline" className="font-mono">
              {brightness}%
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Temperature:</span>
            <Badge variant="outline" className="font-mono">
              {colorTemp}K
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Component Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Color Wheel Picker */}
        <Card>
          <CardHeader>
            <CardTitle>1. Color Wheel Picker</CardTitle>
            <CardDescription>Interactive HSV color selection with presets</CardDescription>
          </CardHeader>
          <CardContent>
            <ColorWheelPicker value={color} onChange={handleColorChange} disabled={isDisabled} />
          </CardContent>
        </Card>

        {/* Sliders */}
        <div className="space-y-8">
          {/* Brightness Slider */}
          <Card>
            <CardHeader>
              <CardTitle>2. Brightness Slider</CardTitle>
              <CardDescription>Enhanced slider with gradient feedback (0-100%)</CardDescription>
            </CardHeader>
            <CardContent>
              <BrightnessSlider
                value={brightness}
                onChange={handleBrightnessChange}
                isUpdating={isUpdating}
                disabled={isDisabled}
              />
            </CardContent>
          </Card>

          {/* Color Temperature Slider */}
          <Card>
            <CardHeader>
              <CardTitle>3. Color Temperature Slider</CardTitle>
              <CardDescription>
                Warm to cool white spectrum (2000K-6500K / 500-153 mireds)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ColorTemperatureSlider
                value={colorTemp}
                onChange={handleColorTempChange}
                isUpdating={isUpdating}
                disabled={isDisabled}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Checklist</CardTitle>
          <CardDescription>Verify all features work correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Color Wheel Picker</h4>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>Click/drag on wheel to select colors</li>
                <li>Indicator dot moves to selected position</li>
                <li>Click preset buttons for quick colors</li>
                <li>Hex display updates in real-time</li>
                <li>HSV values show correct coordinates</li>
                <li>Disabled state prevents interaction</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Brightness Slider</h4>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>Slider moves smoothly from 0-100%</li>
                <li>Gradient background is visible</li>
                <li>Progress bar animates below slider</li>
                <li>Percentage display updates</li>
                <li>Loading indicator (⋯) appears when isUpdating=true</li>
                <li>Disabled state dims the control</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Color Temperature Slider</h4>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>Slider ranges from 2000K (warm) to 6500K (cool)</li>
                <li>Gradient shows orange → yellow → blue</li>
                <li>Labels with color dots are visible</li>
                <li>Kelvin display updates correctly</li>
                <li>Progress bar matches slider position</li>
                <li>100K step size feels responsive</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Animations</h4>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>All components fade in with spring animation</li>
                <li>Color wheel indicator has smooth movement</li>
                <li>Progress bars animate with spring physics</li>
                <li>Toast notifications appear for changes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Notes */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>✅ Ready for Integration</CardTitle>
          <CardDescription>Next steps after testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Once all tests pass, integrate these components into{' '}
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
              DeviceControlPanel.tsx
            </code>
            :
          </p>
          <ol className="text-muted-foreground ml-6 list-decimal space-y-1">
            <li>Replace basic brightness slider with BrightnessSlider</li>
            <li>Replace basic color temp slider with ColorTemperatureSlider</li>
            <li>Add ColorWheelPicker to color controls (new tab or section)</li>
            <li>Connect to HueBridgeAdapter API calls</li>
            <li>Test with real Hue devices</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
