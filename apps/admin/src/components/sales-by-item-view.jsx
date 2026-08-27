"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis } from "recharts"

import { formatCurrency } from "@/lib/currency"
import { aggregateByItem } from "@/lib/sales-query"
import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const chartConfig = {
  netSales: { label: "Net sales", color: "#3b82f6" },
}

export function SalesByItemView({ transactions, chartData, seriesGranularity }) {
  const [chartType, setChartType] = useState("area")

  const topItems = useMemo(() => aggregateByItem(transactions).slice(0, 5), [transactions])
  const isHourly = seriesGranularity === "hourly"
  const ChartComponent = chartType === "area" ? AreaChart : LineChart
  const SeriesComponent = chartType === "area" ? Area : Line

  return (
    <Card className="py-0">
      <CardContent className="grid grid-cols-1 gap-0 p-0 md:grid-cols-[280px_1fr]">
        <div className="border-b p-4 md:border-r md:border-b-0">
          <div className="flex items-center justify-between pb-3">
            <span className="text-sm font-medium">Top 5 items</span>
            <span className="text-xs text-muted-foreground">Net sales</span>
          </div>
          {topItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data to display</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {topItems.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="font-mono tabular-nums">{formatCurrency(item.netSales)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 pb-4">
            <span className="text-sm font-medium">Sales by item chart</span>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <ChartComponent accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => format(new Date(value), isHourly ? "ha" : "d MMM")} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[180px]"
                    nameKey="netSales"
                    labelFormatter={(value) =>
                      format(new Date(value), isHourly ? "d MMM yyyy, h:mm a" : "d MMM yyyy")
                    }
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-muted-foreground">Net sales</span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {formatCurrency(value)}
                        </span>
                      </div>
                    )} />
                } />
              <SeriesComponent
                dataKey="netSales"
                type="monotone"
                stroke="var(--color-netSales)"
                fill={chartType === "area" ? "var(--color-netSales)" : undefined}
                fillOpacity={chartType === "area" ? 0.15 : undefined}
                strokeWidth={2}
                dot={false} />
            </ChartComponent>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
