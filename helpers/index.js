
export function getColumnName(userCurrency) {
	if (userCurrency === "USD") {
		return "price_usd"
	} else if (userCurrency === "UAH") {
		return "price_uah"
	} else if (userCurrency === "EUR") {
		return "price_eur"
	}
}

export function getSymbolForCurrency(userCurrency) {
	if (userCurrency === "USD") {
		return "$"
	} else if (userCurrency === "UAH") {
		return "₴"
	} else if (userCurrency === "EUR") {
		return "€"
	}
}

export function formatNumber(number) {
	return new Intl.NumberFormat('ru-RU').format(number);
}
