export const tables = [
  { id: "01", seats: 2, status: "free" },
  { id: "02", seats: 4, status: "occupied", order: "F0021" },
  { id: "03", seats: 4, status: "occupied", order: "F0027" },
  { id: "04", seats: 2, status: "occupied", order: "F0030" },
  { id: "05", seats: 6, status: "reserved" },
  { id: "06", seats: 2, status: "free" },
  { id: "07", seats: 4, status: "occupied", order: "F0028" },
  { id: "08", seats: 4, status: "free" },
  { id: "09", seats: 2, status: "occupied", order: "F0019" },
  { id: "10", seats: 6, status: "free" },
  { id: "11", seats: 4, status: "reserved" },
  { id: "12", seats: 2, status: "occupied", order: "F0031" },
];

export const tableStatusStyles = {
  free: {
    label: "Free",
    card: "border-border bg-background",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  occupied: {
    label: "Occupied",
    card: "border-rose-100 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
  },
  reserved: {
    label: "Reserved",
    card: "border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
};

export const financeSummary = [
  { label: "Today's Revenue", value: 73680, isCurrency: true, change: "+12.4%", up: true },
  { label: "Orders Today", value: "78", change: "+6.1%", up: true },
  { label: "Avg. Order Value", value: 944, isCurrency: true, change: "-2.3%", up: false },
  { label: "Refunds", value: 1440, isCurrency: true, change: "+1 today", up: false },
];

export const recentTransactions = [
  { id: "F0030", table: "04", amount: 2880, method: "Card", time: "2:14 PM" },
  { id: "F0029", table: "08", amount: 1660, method: "Cash", time: "1:52 PM" },
  { id: "F0028", table: "07", amount: 720, method: "Card", time: "1:40 PM" },
  { id: "F0027", table: "03", amount: 3850, method: "Scan", time: "1:12 PM" },
  { id: "F0026", table: "10", amount: 1080, method: "Cash", time: "12:55 PM" },
];

export const weeklySales = [
  { day: "Mon", value: 39200 },
  { day: "Tue", value: 44800 },
  { day: "Wed", value: 34400 },
  { day: "Thu", value: 53600 },
  { day: "Fri", value: 71200 },
  { day: "Sat", value: 85600 },
  { day: "Sun", value: 73680 },
];

export const dashboardStats = [
  { label: "Today's Revenue", value: 73680, isCurrency: true, change: "+12.4%", up: true, icon: "Wallet" },
  { label: "Orders Today", value: "78", change: "+6.1%", up: true, icon: "ClipboardList" },
  { label: "Active Tables", value: "5 / 12", change: "42% full", up: true, icon: "Table2" },
  { label: "Avg. Prep Time", value: "14 min", change: "-1.5 min", up: true, icon: "Timer" },
];

export const topDishes = [
  { name: "Pasta with Roast Beef", emoji: "🍝", sold: 42, revenue: 16800 },
  { name: "Grilled Salmon Steak", emoji: "🐟", sold: 31, revenue: 18600 },
  { name: "Shrimp Rice Bowl", emoji: "🍤", sold: 28, revenue: 6720 },
  { name: "Beef Steak", emoji: "🥩", sold: 19, revenue: 22800 },
];

export const expenseCategories = ["Ingredients", "Payroll", "Utilities", "Maintenance", "Other"];

export const initialExpenses = [
  { id: "e1", label: "Vegetable Supplier", category: "Ingredients", amount: 12500, date: "2026-08-20" },
  { id: "e2", label: "Gas Refill", category: "Utilities", amount: 3200, date: "2026-08-21" },
  { id: "e3", label: "Staff Wages", category: "Payroll", amount: 45000, date: "2026-08-22" },
  { id: "e4", label: "Cleaning Supplies", category: "Maintenance", amount: 1800, date: "2026-08-23" },
];

export const monthlySummary = [
  { week: "Week 1", revenue: 298000, orders: 312 },
  { week: "Week 2", revenue: 341500, orders: 356 },
  { week: "Week 3", revenue: 312800, orders: 329 },
  { week: "Week 4 (to date)", revenue: 187460, orders: 201 },
];

export const faqItems = [
  {
    q: "How do I start a new order?",
    a: "Go to Order Line, pick a table, tap dishes from the Foodies Menu to add them, then Place Order.",
  },
  {
    q: "How do I mark a table as free again?",
    a: "Open Manage Table and use the table's menu to close out the active order once it's paid.",
  },
  {
    q: "Can I edit a dish price or availability?",
    a: "Yes, from Manage Dishes you can edit price, category and mark a dish as out of stock.",
  },
  {
    q: "Where do I see today's sales?",
    a: "The Finance page shows today's revenue, order count, and recent transactions.",
  },
];
