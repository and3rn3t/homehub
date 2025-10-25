import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useUnits, type UnitSystem } from '@/hooks/use-units'
import { CompassIcon, ThermometerIcon } from '@/lib/icons'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function UnitSettings() {
  const { preferences, system, setUnitSystem } = useUnits()

  const handleSystemChange = (value: UnitSystem) => {
    setUnitSystem(value)
    toast.success(`Unit system changed to ${value === 'metric' ? 'Metric' : 'Imperial'}`, {
      description: `Temperature will now display in ${value === 'metric' ? 'Celsius' : 'Fahrenheit'}`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-xl font-semibold">Unit Preferences</h2>
        <p className="text-muted-foreground text-sm">
          Choose your preferred measurement system for temperature, distance, and more
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CompassIcon className="text-primary h-5 w-5" />
            <CardTitle>Measurement System</CardTitle>
          </div>
          <CardDescription>
            Select between metric and imperial units for all measurements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={system} onValueChange={handleSystemChange}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="border-border hover:bg-accent/5 flex items-center space-x-3 rounded-lg border p-4"
            >
              <RadioGroupItem value="imperial" id="imperial" />
              <Label htmlFor="imperial" className="flex-1 cursor-pointer">
                <div className="font-medium">Imperial (US)</div>
                <div className="text-muted-foreground text-sm">
                  Fahrenheit, miles, pounds, gallons
                </div>
              </Label>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="border-border hover:bg-accent/5 flex items-center space-x-3 rounded-lg border p-4"
            >
              <RadioGroupItem value="metric" id="metric" />
              <Label htmlFor="metric" className="flex-1 cursor-pointer">
                <div className="font-medium">Metric (International)</div>
                <div className="text-muted-foreground text-sm">
                  Celsius, kilometers, kilograms, liters
                </div>
              </Label>
            </motion.div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ThermometerIcon className="text-primary h-5 w-5" />
            <CardTitle>Current Settings</CardTitle>
          </div>
          <CardDescription>Your active measurement preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border-border rounded-lg border p-3">
              <div className="text-muted-foreground text-xs font-medium">Temperature</div>
              <div className="text-foreground mt-1 font-semibold">
                {preferences.temperature === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
              </div>
            </div>

            <div className="border-border rounded-lg border p-3">
              <div className="text-muted-foreground text-xs font-medium">Distance</div>
              <div className="text-foreground mt-1 font-semibold">
                {preferences.distance === 'kilometers' ? 'Kilometers (km)' : 'Miles (mi)'}
              </div>
            </div>

            <div className="border-border rounded-lg border p-3">
              <div className="text-muted-foreground text-xs font-medium">Weight</div>
              <div className="text-foreground mt-1 font-semibold">
                {preferences.weight === 'kilograms' ? 'Kilograms (kg)' : 'Pounds (lbs)'}
              </div>
            </div>

            <div className="border-border rounded-lg border p-3">
              <div className="text-muted-foreground text-xs font-medium">Speed</div>
              <div className="text-foreground mt-1 font-semibold">
                {preferences.speed === 'kmh' ? 'Kilometers/hour (km/h)' : 'Miles/hour (mph)'}
              </div>
            </div>

            <div className="border-border rounded-lg border p-3">
              <div className="text-muted-foreground text-xs font-medium">Volume</div>
              <div className="text-foreground mt-1 font-semibold">
                {preferences.volume === 'liters' ? 'Liters (L)' : 'Gallons (gal)'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass" className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ThermometerIcon className="text-primary mt-0.5 h-5 w-5" />
            <div className="flex-1">
              <div className="text-foreground text-sm font-medium">Automatic Conversion</div>
              <div className="text-muted-foreground text-xs">
                All temperatures and measurements throughout the app will automatically display in
                your preferred units. Device data is converted in real-time.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
