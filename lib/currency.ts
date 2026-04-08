export function getCurrencySymbol(currency: string = "INR") {
  switch (currency) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    default:
      return null;
  }
}