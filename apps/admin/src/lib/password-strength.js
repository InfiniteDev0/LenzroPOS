export function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, label: "", bars: 0 };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  switch (score) {
    case 5:
      return { score, label: "Very strong", bars: 4 };
    case 4:
      return { score, label: "Strong", bars: 3 };
    case 3:
      return { score, label: "Fair", bars: 2 };
    case 2:
      return { score, label: "Weak", bars: 1 };
    default:
      return { score, label: "Too weak", bars: 1 };
  }
}

export const PASSWORD_STRENGTH_BAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
];
