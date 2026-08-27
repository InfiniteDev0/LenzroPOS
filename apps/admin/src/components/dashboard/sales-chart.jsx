"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import { formatCurrency } from "@/lib/currency"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  value: {
    label: "Sales",
    color: "#0d9488",
  },
}

export function SalesChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:py-6">
          <CardTitle>Sales This Week</CardTitle>
          <CardDescription>Revenue for the last 7 days</CardDescription>
        </div>
        <div className="flex flex-col justify-center gap-1 border-t px-6 py-4 text-left sm:border-t-0 sm:border-l sm:px-8 sm:py-6">
          <span className="text-xs text-muted-foreground">Total Sales</span>
          <span className="text-lg leading-none font-bold sm:text-3xl">
            {formatCurrency(total)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-36"
                  nameKey="value"
                  formatter={(value) => (
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-muted-foreground">Sales</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
