
export function getColumnName(userCurrency) {
	if (userCurrency === "USD") {
		return "price_usd"
	} else if (userCurrency === "UAH") {
		return "price_uah"
	} else if (userCurrency === "EUR") {
		return "price_eur"
	}
}
