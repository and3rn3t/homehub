import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@/hooks/use-kv'
import { Calendar, ClockIcon, Leaf, ZapIcon, TrendingUpIcon } from '@/lib/icons'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

interface EnergyData {
  date: string
  consumption: number
  cost: number
  savings?: number
}

interface DeviceUsage {
  deviceName: string
  consumption: number
  cost: number
  percentage: number
}

export function Energy() {
  const [energyData] = useKV<EnergyData[]>('energy-data', [
    { date: 'Mon', consumption: 45, cost: 12.5 },
    { date: 'Tue', consumption: 38, cost: 10.25 },
    { date: 'Wed', consumption: 52, cost: 14.3 },
    { date: 'Thu', consumption: 41, cost: 11.75 },
    { date: 'Fri', consumption: 48, cost: 13.2 },
    { date: 'Sat', consumption: 55, cost: 15.1 },
    { date: 'Sun', consumption: 43, cost: 11.9 },
  ])

  const [deviceUsage] = useKV<DeviceUsage[]>('device-usage', [
    { deviceName: 'HVAC System', consumption: 85, cost: 23.5, percentage: 45 },
    { deviceName: 'Water Heater', consumption: 32, cost: 8.8, percentage: 17 },
    { deviceName: 'Lighting', consumption: 28, cost: 7.7, percentage: 15 },
    { deviceName: 'Kitchen Appliances', consumption: 24, cost: 6.6, percentage: 13 },
    { deviceName: 'Other', consumption: 19, cost: 5.2, percentage: 10 },
  ])

  const [monthlyBudget] = useKV('monthly-budget', 150)
  const currentSpend = 89.45
  const budgetProgress = (currentSpend / monthlyBudget) * 100

  const totalConsumption = energyData.reduce((sum, day) => sum + day.consumption, 0)
  const avgDailyConsumption = totalConsumption / energyData.length
  const lastDay = energyData[energyData.length - 1]
  const firstDay = energyData[0]
  const weeklyTrend =
    lastDay && firstDay
      ? ((lastDay.consumption - firstDay.consumption) / firstDay.consumption) * 100
      : 0

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Energy</h1>
            <p className="text-muted-foreground">Monitor your power usage</p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Calendar size={20} />
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <Lightning size={20} className="text-primary mx-auto mb-2" />
              <div className="text-primary mb-1 text-lg font-bold">
                {avgDailyConsumption.toFixed(1)} kWh
              </div>
              <div className="text-muted-foreground text-xs">Daily Avg</div>
            </CardContent>
          </Card>

          <Card className="bg-accent/10 border-accent/20">
            <CardContent className="p-4 text-center">
              <Leaf size={20} className="text-accent mx-auto mb-2" />
              <div className="text-accent mb-1 text-lg font-bold">12.3 kg</div>
              <div className="text-muted-foreground text-xs">CO₂ Saved</div>
            </CardContent>
          </Card>

          <Card className="bg-secondary border-border/50">
            <CardContent className="p-4 text-center">
              <TrendUp
                size={20}
                className={`mx-auto mb-2 ${weeklyTrend > 0 ? 'text-destructive' : 'text-accent'}`}
              />
              <div
                className={`mb-1 text-lg font-bold ${weeklyTrend > 0 ? 'text-destructive' : 'text-accent'}`}
              >
                {weeklyTrend > 0 ? '+' : ''}
                {weeklyTrend.toFixed(1)}%
              </div>
              <div className="text-muted-foreground text-xs">vs Last Week</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Monthly Budget</CardTitle>
              <span className="text-muted-foreground text-sm">
                ${currentSpend.toFixed(2)} / ${monthlyBudget}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={budgetProgress} className="mb-2 h-2" />
            <div className="flex justify-between text-sm">
              <span className={budgetProgress > 80 ? 'text-destructive' : 'text-muted-foreground'}>
                {budgetProgress.toFixed(1)}% used
              </span>
              <span className="text-muted-foreground">
                ${(monthlyBudget - currentSpend).toFixed(2)} remaining
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Weekly Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={energyData}>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis hide />
                  <Line
                    type="monotone"
                    dataKey="consumption"
                    stroke="oklch(0.6 0.15 250)"
                    strokeWidth={2}
                    dot={{ fill: 'oklch(0.6 0.15 250)', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, stroke: 'oklch(0.6 0.15 250)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Device Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceUsage.map((device, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{device.deviceName}</span>
                    <div className="text-right">
                      <div className="font-medium">${device.cost.toFixed(2)}</div>
                      <div className="text-muted-foreground text-xs">{device.consumption} kWh</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={device.percentage} className="h-2 flex-1" />
                    <span className="text-muted-foreground w-8 text-xs">{device.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Usage Insights</CardTitle>
              <Clock size={16} className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-accent/10 border-accent/20 rounded-lg border p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Leaf size={16} className="text-accent" />
                  <span className="text-accent text-sm font-medium">Energy Tip</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Your HVAC is using 45% of total energy. Consider adjusting the schedule during
                  off-peak hours.
                </p>
              </div>

              <div className="bg-primary/10 border-primary/20 rounded-lg border p-3">
                <div className="mb-1 flex items-center gap-2">
                  <TrendUp size={16} className="text-primary" />
                  <span className="text-primary text-sm font-medium">Peak Usage</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Highest consumption typically occurs between 6-9 PM. Schedule heavy appliances
                  outside this window.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
