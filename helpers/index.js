
export function getColumnName(userCurrency) {
	if (userCurrency === "USD") {
		return "usd"
	} else if (userCurrency === "UAH") {
		return "uah"
	} else if (userCurrency === "EUR") {
		return "eur"
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
