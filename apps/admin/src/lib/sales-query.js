import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
  subDays,
} from "date-fns"

export function resolveDateRange(dateFilter) {
  if (dateFilter.mode === "single") {
    const day = startOfDay(dateFilter.value)
    return { start: day, end: endOfDay(day) }
  }

  const { from, to } = dateFilter.value ?? {}
  const start = startOfDay(from ?? new Date())
  const end = endOfDay(to ?? from ?? new Date())
  return { start, end }
}

function previousPeriodRange({ start, end }) {
  const lengthInDays = differenceInCalendarDays(end, start) + 1
  const prevEnd = subDays(start, 1)
  const prevStart = subDays(prevEnd, lengthInDays - 1)
  return { start: startOfDay(prevStart), end: endOfDay(prevEnd) }
}

function isWithinTimeOfDay(timestamp, timeFilter) {
  if (timeFilter.mode === "all-day") return true
  const time = format(timestamp, "HH:mm")
  return time >= timeFilter.start && time <= timeFilter.end
}

function matchesEmployee(transaction, employeeIds) {
  return employeeIds.length === 0 || employeeIds.includes(transaction.employeeId)
}

export function filterTransactions(transactions, { start, end }, timeFilter, employeeIds) {
  return transactions.filter(
    (t) =>
      t.timestamp >= start &&
      t.timestamp <= end &&
      isWithinTimeOfDay(t.timestamp, timeFilter) &&
      matchesEmployee(t, employeeIds)
  )
}

function summarize(transactions) {
  return transactions.reduce(
    (totals, t) => ({
      grossSales: totals.grossSales + t.gross,
      discounts: totals.discounts + t.discount,
      refunds: totals.refunds + t.refund,
      netSales: totals.netSales + t.net,
      grossProfit: totals.grossProfit + t.profit,
    }),
    { grossSales: 0, discounts: 0, refunds: 0, netSales: 0, grossProfit: 0 }
  )
}

function buildDailySeries(transactions, range) {
  const byDay = new Map()
  for (const t of transactions) {
    const key = format(t.timestamp, "yyyy-MM-dd")
    const existing = byDay.get(key)
    if (existing) {
      existing.grossSales += t.gross
      existing.discounts += t.discount
      existing.refunds += t.refund
      existing.netSales += t.net
      existing.grossProfit += t.profit
    } else {
      byDay.set(key, {
        date: key,
        grossSales: t.gross,
        discounts: t.discount,
        refunds: t.refund,
        netSales: t.net,
        grossProfit: t.profit,
      })
    }
  }

  // Include every day in the range (even with zero sales) so the chart
  // doesn't silently skip gaps.
  return eachDayOfInterval({ start: range.start, end: range.end }).map((day) => {
    const key = format(day, "yyyy-MM-dd")
    return byDay.get(key) ?? { date: key, grossSales: 0, discounts: 0, refunds: 0, netSales: 0, grossProfit: 0 }
  })
}

function buildHourlySeries(transactions, day) {
  const byHour = new Map()
  for (const t of transactions) {
    const key = format(t.timestamp, "yyyy-MM-dd'T'HH:00:00")
    const existing = byHour.get(key)
    if (existing) {
      existing.grossSales += t.gross
      existing.discounts += t.discount
      existing.refunds += t.refund
      existing.netSales += t.net
      existing.grossProfit += t.profit
    } else {
      byHour.set(key, {
        date: key,
        grossSales: t.gross,
        discounts: t.discount,
        refunds: t.refund,
        netSales: t.net,
        grossProfit: t.profit,
      })
    }
  }

  // Every hour of the day (even with zero sales) so the chart shows the
  // full day instead of a single collapsed point.
  return Array.from({ length: 24 }, (_, hour) => {
    const hourDate = new Date(day)
    hourDate.setHours(hour, 0, 0, 0)
    const key = format(hourDate, "yyyy-MM-dd'T'HH:00:00")
    return byHour.get(key) ?? { date: key, grossSales: 0, discounts: 0, refunds: 0, netSales: 0, grossProfit: 0 }
  })
}

const METRIC_META = {
  grossSales: { label: "Gross sales", description: "Total value of all sales before deductions." },
  refunds: { label: "Refunds", description: "Total amount refunded to customers." },
  discounts: { label: "Discounts", description: "Total value of discounts applied to orders." },
  netSales: { label: "Net sales", description: "Gross sales minus discounts and refunds." },
  grossProfit: { label: "Gross profit", description: "Net sales minus the cost of goods sold." },
}

// Filters the raw transaction list by date range, time-of-day window, and
// employee selection, then derives everything the sales overview needs:
// a daily chart series and the 5 stat-card totals (each with a real
// change vs. the immediately preceding period of equal length).
export function computeSalesOverview(transactions, { dateFilter, timeFilter, employeeIds }) {
  const range = resolveDateRange(dateFilter)
  const current = filterTransactions(transactions, range, timeFilter, employeeIds)
  const previous = filterTransactions(
    transactions,
    previousPeriodRange(range),
    timeFilter,
    employeeIds
  )

  const currentTotals = summarize(current)
  const previousTotals = summarize(previous)

  const metrics = Object.entries(METRIC_META).map(([key, meta]) => {
    const total = currentTotals[key]
    const previousTotal = previousTotals[key]
    const changeFraction = previousTotal === 0 ? (total === 0 ? 0 : 1) : (total - previousTotal) / previousTotal

    return {
      key,
      ...meta,
      total,
      changeFraction,
      changeAmount: total - previousTotal,
    }
  })

  const isSingleDay = dateFilter.mode === "single"

  return {
    chartData: isSingleDay ? buildHourlySeries(current, range.start) : buildDailySeries(current, range),
    seriesGranularity: isSingleDay ? "hourly" : "daily",
    metrics,
    range,
    transactions: current,
    transactionCount: current.length,
  }
}

// The breakdown views below (item / category / employee / payment /
// discounts) all operate on the already-filtered transaction list returned
// above as `transactions` — they don't re-apply the date/time/employee
// filters themselves.

export function aggregateByItem(transactions) {
  const byItem = new Map()
  for (const t of transactions) {
    const existing = byItem.get(t.itemName)
    if (existing) {
      existing.quantity += t.quantity
      existing.grossSales += t.gross
      existing.netSales += t.net
    } else {
      byItem.set(t.itemName, {
        name: t.itemName,
        category: t.category,
        quantity: t.quantity,
        grossSales: t.gross,
        netSales: t.net,
      })
    }
  }
  return Array.from(byItem.values()).sort((a, b) => b.netSales - a.netSales)
}

export function aggregateByCategory(transactions) {
  const byCategory = new Map()
  for (const t of transactions) {
    const existing = byCategory.get(t.category)
    const costOfGoods = t.net - t.profit
    if (existing) {
      existing.itemsSold += t.quantity
      existing.netSales += t.net
      existing.costOfGoods += costOfGoods
      existing.grossProfit += t.profit
    } else {
      byCategory.set(t.category, {
        category: t.category,
        itemsSold: t.quantity,
        netSales: t.net,
        costOfGoods,
        grossProfit: t.profit,
      })
    }
  }
  return Array.from(byCategory.values()).sort((a, b) => b.netSales - a.netSales)
}

export function aggregateByEmployee(transactions) {
  const byEmployee = new Map()
  for (const t of transactions) {
    const existing = byEmployee.get(t.employeeId)
    if (existing) {
      existing.grossSales += t.gross
      existing.refunds += t.refund
      existing.discounts += t.discount
      existing.netSales += t.net
      existing.receipts += 1
    } else {
      byEmployee.set(t.employeeId, {
        employeeId: t.employeeId,
        name: t.employeeName ?? t.employeeId,
        grossSales: t.gross,
        refunds: t.refund,
        discounts: t.discount,
        netSales: t.net,
        receipts: 1,
      })
    }
  }
  return Array.from(byEmployee.values())
    .map((row) => ({
      ...row,
      averageSale: row.receipts ? row.netSales / row.receipts : 0,
    }))
    .sort((a, b) => b.netSales - a.netSales)
}

export function aggregateByPaymentType(transactions) {
  const byMethod = new Map()
  for (const t of transactions) {
    const existing = byMethod.get(t.paymentMethod)
    if (existing) {
      existing.transactions += 1
      existing.grossSales += t.gross
      existing.netSales += t.net
    } else {
      byMethod.set(t.paymentMethod, {
        method: t.paymentMethod,
        transactions: 1,
        grossSales: t.gross,
        netSales: t.net,
      })
    }
  }
  return Array.from(byMethod.values()).sort((a, b) => b.grossSales - a.grossSales)
}

export function aggregateDiscounts(transactions) {
  const byType = new Map()
  for (const t of transactions) {
    if (!t.discountType) continue
    const existing = byType.get(t.discountType)
    if (existing) {
      existing.count += 1
      existing.amount += t.discount
    } else {
      byType.set(t.discountType, { name: t.discountType, count: 1, amount: t.discount })
    }
  }
  return Array.from(byType.values()).sort((a, b) => b.amount - a.amount)
}
