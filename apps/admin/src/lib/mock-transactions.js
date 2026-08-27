import { EMPLOYEES } from "@/lib/employees"

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const MENU_ITEMS = [
  { name: "Beef Burger", category: "Mains", price: 850 },
  { name: "Chicken Wrap", category: "Mains", price: 650 },
  { name: "Grilled Fish", category: "Mains", price: 1200 },
  { name: "French Fries", category: "Sides", price: 250 },
  { name: "Garden Salad", category: "Sides", price: 350 },
  { name: "Soda", category: "Drinks", price: 150 },
  { name: "Fresh Juice", category: "Drinks", price: 300 },
  { name: "Iced Coffee", category: "Drinks", price: 350 },
  { name: "Chocolate Cake", category: "Desserts", price: 450 },
  { name: "Ice Cream", category: "Desserts", price: 300 },
]

export const PAYMENT_METHODS = ["Mpesa", "Cash", "Card"]

export const DISCOUNT_TYPES = ["Discount by points", "Employee discount", "Promo code"]

const DAYS = 180;
const today = startOfDay(new Date());
const rand = seededRandom(11);

function randomInt(min, max) {
  return Math.floor(min + rand() * (max - min + 1));
}

function pick(list) {
  return list[randomInt(0, list.length - 1)];
}

// Raw, per-order mock sales data (last 180 days) across the four employees.
// Everything shown in the sales reports (chart, stat totals, item/category/
// employee/payment/discount breakdowns) is derived from filtering this list,
// so any combination of date range, time-of-day window, and employee
// selection produces a real, consistent number.
export const mockTransactions = Array.from({ length: DAYS }).flatMap((_, i) => {
  const date = new Date(today);
  date.setDate(date.getDate() - (DAYS - 1 - i));

  const ordersToday = randomInt(5, 18);

  return Array.from({ length: ordersToday }, (_, j) => {
    const employee = pick(EMPLOYEES);
    const item = pick(MENU_ITEMS);
    const quantity = randomInt(1, 3);
    const paymentMethod = pick(PAYMENT_METHODS);

    const hour = randomInt(7, 21);
    const minute = randomInt(0, 59);
    const timestamp = new Date(date);
    timestamp.setHours(hour, minute, 0, 0);

    const gross = item.price * quantity;
    const discount = rand() < 0.2 ? Math.round(gross * (0.05 + rand() * 0.1)) : 0;
    const discountType = discount > 0 ? pick(DISCOUNT_TYPES) : null;
    const refund = rand() < 0.05 ? gross - discount : 0;
    const net = gross - discount - refund;
    const cost = Math.round(net * (0.45 + rand() * 0.2));
    const profit = net - cost;

    return {
      id: `${date.toISOString().slice(0, 10)}-${j}`,
      timestamp,
      employeeId: employee.id,
      itemName: item.name,
      category: item.category,
      quantity,
      paymentMethod,
      discountType,
      gross,
      discount,
      refund,
      net,
      profit,
    };
  });
});
