"use client"

import { useMemo, useState } from "react"
import { format, startOfMonth, startOfWeek } from "date-fns"
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { InfoIcon } from "lucide-react"

import { formatCurrency } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const chartConfig = {
  grossSales: { label: "Gross sales", color: "#3b82f6" },
  refunds: { label: "Refunds", color: "#ef4444" },
  discounts: { label: "Discounts", color: "#f59e0b" },
  netSales: { label: "Net sales", color: "#10b981" },
  grossProfit: { label: "Gross profit", color: "#8b5cf6" },
}

function aggregate(data, granularity) {
  if (granularity === "days") return data

  const buckets = new Map()
  for (const day of data) {
    const bucketDate =
      granularity === "weeks" ? startOfWeek(new Date(day.date)) : startOfMonth(new Date(day.date))
    const key = format(bucketDate, "yyyy-MM-dd")
    const existing = buckets.get(key)

    if (existing) {
      existing.grossSales += day.grossSales
      existing.refunds += day.refunds
      existing.discounts += day.discounts
      existing.netSales += day.netSales
      existing.grossProfit += day.grossProfit
    } else {
      buckets.set(key, { ...day, date: key })
    }
  }
  return Array.from(buckets.values())
}

export function SalesOverviewChart({ chartData, metrics, seriesGranularity = "daily" }) {
  const [activeMetric, setActiveMetric] = useState("grossSales")
  const [chartType, setChartType] = useState("area")
  const [bucketGranularity, setBucketGranularity] = useState("days")

  const isHourly = seriesGranularity === "hourly"
  const data = useMemo(
    () => (isHourly ? chartData : aggregate(chartData, bucketGranularity)),
    [chartData, bucketGranularity, isHourly]
  )
  const activeLabel = chartConfig[activeMetric].label
  const ChartComponent = chartType === "area" ? AreaChart : LineChart
  const SeriesComponent = chartType === "area" ? Area : Line

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            data-active={activeMetric === metric.key}
            className="flex flex-1 flex-col justify-center gap-1 border-t border-b-2 border-b-transparent px-6 py-4 text-left even:border-l data-[active=true]:border-b-emerald-500 sm:border-t-0 sm:border-l sm:px-6 sm:py-4"
            onClick={() => setActiveMetric(metric.key)}>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {metric.label}
              <Tooltip>
                <TooltipTrigger render={<InfoIcon className="size-3" />} />
                <TooltipContent>{metric.description}</TooltipContent>
              </Tooltip>
            </span>
            <span className="text-lg leading-none font-bold sm:text-2xl">
              {formatCurrency(metric.total, { decimals: 2 })}
            </span>
            <span
              className={cn(
                "text-xs",
                metric.changeFraction >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
              {formatCurrency(Math.abs(metric.changeAmount), { decimals: 2 })} (
              {metric.changeFraction >= 0 ? "+" : "-"}
              {Math.abs(metric.changeFraction * 100).toFixed(1)}%)
            </span>
          </button>
        ))}
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <div className="flex items-center justify-between gap-2 pb-4">
          <span className="text-sm font-medium">{activeLabel}</span>
          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>
            {!isHourly && (
              <Select value={bucketGranularity} onValueChange={setBucketGranularity}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <ChartComponent
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                format(new Date(value), isHourly ? "ha" : "d MMM")
              } />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  nameKey={activeMetric}
                  labelFormatter={(value) =>
                    format(new Date(value), isHourly ? "d MMM yyyy, h:mm a" : "d MMM yyyy")
                  }
                  formatter={(value) => (
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-muted-foreground">{activeLabel}</span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  )} />
              } />
            <SeriesComponent
              dataKey={activeMetric}
              type="monotone"
              stroke={`var(--color-${activeMetric})`}
              fill={chartType === "area" ? `var(--color-${activeMetric})` : undefined}
              fillOpacity={chartType === "area" ? 0.15 : undefined}
              strokeWidth={2}
              dot={false} />
          </ChartComponent>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
