export const statusFilters = [
  { id: "all", label: "All", count: 78 },
  { id: "dine-in", label: "Dine in", count: 4, dot: "bg-sky-500" },
  { id: "wait-list", label: "Wait List", count: 3, dot: "bg-orange-500" },
  { id: "take-away", label: "Take Away", count: 12, dot: "bg-violet-500" },
  { id: "served", label: "Served", count: 69, dot: "bg-emerald-500" },
];

export const orderQueue = [
  {
    id: "F0027",
    table: "03",
    items: 8,
    time: "2 mins ago",
    status: "In Kitchen",
    theme: "emerald",
  },
  {
    id: "F0028",
    table: "07",
    items: 3,
    time: "Just Now",
    status: "Wait List",
    theme: "rose",
  },
  {
    id: "F0019",
    table: "09",
    items: 2,
    time: "25 mins ago",
    status: "Ready",
    theme: "violet",
  },
  {
    id: "F0031",
    table: "12",
    items: 5,
    time: "31 mins ago",
    status: "In Kitchen",
    theme: "emerald",
  },
];

export const menuCategories = [
  { id: "all", label: "All Menu", count: 154, icon: "Utensils" },
  { id: "special", label: "Special", count: 19, icon: "Star" },
  { id: "soups", label: "Soups", count: 3, icon: "Soup" },
  { id: "desserts", label: "Desserts", count: 19, icon: "Cake" },
  { id: "chickens", label: "Chickens", count: 10, icon: "Drumstick" },
];

export const menuItems = [
  { id: "salmon-steak", name: "Grilled Salmon Steak", tag: "Lunch", price: 600, category: "special", emoji: "🐟" },
  { id: "tofu-poke", name: "Tofu Poke Bowl", tag: "Salad", price: 280, category: "special", emoji: "🥗" },
  { id: "pasta-roast-beef", name: "Pasta with Roast Beef", tag: "Pasta", price: 400, category: "special", emoji: "🍝" },
  { id: "beef-steak", name: "Beef Steak", tag: "Beef", price: 1200, category: "special", emoji: "🥩" },
  { id: "shrimp-rice-bowl", name: "Shrimp Rice Bowl", tag: "Rice", price: 240, category: "special", emoji: "🍤" },
  { id: "apple-pancake", name: "Apple Stuffed Pancake", tag: "Dessert", price: 1400, category: "desserts", emoji: "🥞" },
  { id: "chicken-quinoa", name: "Chicken Quinoa & Herbs", tag: "Chicken", price: 480, category: "chickens", emoji: "🍗" },
  { id: "vegetable-shrimp", name: "Vegetable Shrimp", tag: "Salad", price: 400, category: "special", emoji: "🥗" },
  { id: "miso-soup", name: "Classic Miso Soup", tag: "Soup", price: 200, category: "soups", emoji: "🍲" },
  { id: "tom-yum", name: "Tom Yum Soup", tag: "Soup", price: 320, category: "soups", emoji: "🍜" },
  { id: "berry-tart", name: "Fresh Berry Tart", tag: "Dessert", price: 360, category: "desserts", emoji: "🍰" },
  { id: "roast-chicken", name: "Herb Roast Chicken", tag: "Chicken", price: 720, category: "chickens", emoji: "🍗" },
  { id: "buffalo-wings", name: "Buffalo Chicken Wings", tag: "Chicken", price: 440, category: "chickens", emoji: "🍗" },
  { id: "seafood-paella", name: "Seafood Paella", tag: "Rice", price: 880, category: "special", emoji: "🥘" },
  { id: "creme-brulee", name: "Creme Brulee", tag: "Dessert", price: 320, category: "desserts", emoji: "🍮" },
  { id: "clam-chowder", name: "Clam Chowder", tag: "Soup", price: 360, category: "soups", emoji: "🍲" },
];

export const defaultCartQuantities = {
  "pasta-roast-beef": 2,
  "shrimp-rice-bowl": 2,
  "apple-pancake": 1,
  "vegetable-shrimp": 1,
};
