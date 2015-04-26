## require
require('econcc') returns the EconCC class.
An instance must be created using new: new EconCC(...)

## class EconCC
##### enum EconCC.Mode
EconCC.Mode.{Short, Long, ShortRange, LongRange, Label}

Formatting is described in [#format](#format).

##### enum EconCC.Range
EconCC.Range.{Low, Mid, High}
* Low: Low-end of the range
* Mid: Average of low and high
* High: High-end of the range

##### interface EconCCValue (Object)
* value: Value in the respective currency.
* currency: {String currency.internal} of the value.

##### interface EconCCRangedValue (Object)
* low: Low value.
* high?: High value. If not defined, considered equal to low.
* currency: {String currency.internal} of the value.

##### type EconCCCurrency (Object/String)
A currency alias, a currency's {currency.internal}, or a currency object (in .currencies).

##### type EconCCNumberValue (Object/Number)
Value in Number or an Object containg a 'value' property, such as EconCCValue. A EconCCNumberValue as Object can also contain .currency which will be used as currency for functions that require them.

##### EconCC.iFromBackpack(Object item) -> EconCCRangedValue
Converts an item's value in backpack.tf IGetPrices v4 format to EconCC format.
##### EconCC.cFromBackpack(Object currencies, Object pricelist) -> Object
Returns an object containing currencies from backpack.tf's IGetCurrencies(v1)/IGetPrices(v4) APIs in EconCC format. Currently only Team Fortress 2 is supported.

##### #constructor(Object currencies?, Object pricelist?) -> EconCC instance
Initializes this EconCC instance. If pricelist is specified, currencies and pricelist are passed to EconCC.cFromBackpack and imported. Otherwise, currencies (here, poorly named) is passed to #modify (can also be empty).
##### .currencies (Object)
Object containing this instance's currencies. **Call #update after modifying this object.**
##### .aliases (Object)
(String)alias->(String)currency.internal key-value pair. Essentially additional names for currencies, when referenced by code.
##### .step (EconCC.Enabled/EconCC.Disabled) = EconCC.Disabled
Whether currency step (defined per currency) should be enabled or disabled. For example, 0.06 ref being rounded to 0.05 ref.
##### .trailing (EconCC.Enabled/EconCC.Disabled/EconCC.Auto) = EconCC.Auto
Whether trailing zeros should be cut off (EconCC.Disabled) or kept (EconCC.Enabled). EconCC.Auto means the currency decides whether it wants trailing zeros.
##### .range (enum EconCC.Range) = EconCC.Range.Low
Which part of the range should be used. By default EconCC.Range.Low, but EconCC.cFromBackpack makes it EconCC.Range.Mid.
##### .separators (Object{String thousand=",", String decimal="."})
Thousand and decimal separators.

##### #modify(Object opts) -> this
Applies the opts to the instance (.currencies, .aliases, etc.) and calls #update.
##### #update() -> this
Updates the currencies to have their BC values set up. Must be called whenever .currencies is changed, even real world currencies, otherwise you will continue using the old values.

##### #valueFromRange(EconCCRangedValue value) -> EconCCValue
Converts the EconCCRangedValue to an EconCCValue based on .range.

##### #convertToBC(EconCCNumberValue value, EconCCCurrency currency=value.currency) -> Number
Converts the value from the currency to BC.

##### #convertFromBC(EconCCNumberValue value, EconCCCurrency currency=value.currency) -> Number
Converts the value from BC to the currency.

##### #convertToCurrency(EconCCNumberValue value, EconCCCurrency oldc, EconCCCurrency newc) -> EconCCValue
##### #convertToCurrency(EconCCValue value, EconCCCurrency newc) -> EconCCValue
Converts value from currency oldc to currency newc. Value is not rounded. In the second version, oldc is value.currency.

##### #formatCurrencyRange(EconCCRangedValue value) -> String
Formats a EconCCRangedValue as `$1.00–2.00` or `1.00–2.00 ref` (defined by currency) using multiple calls to #formatCurrency. If value.high is missing, it will act like #formatCurrency using value.low.

Important to note: the range separator is not - (HYPHEN-MINUS U+002D) but instead – (EN DASH U+2013).

##### #formatCurrency(EconCCNumberValue value, EconCCCurrency currency=value.currency, Boolean name=true) -> String
Formats an EconCC(Number)Value, including trailing zeros, step, and rounding. If name is not false, this function will also add the currency's name according to the amount (singular/plural).

##### #f(String value) -> String
Helper function for #format. value's format is `low-high currency:mode`, examples:
* 1-2 ref:Long
* 1 key:Short
* 1 hat

Mode defaults to EconCC.Mode.Short.

##### #format(EconCCRangedValue|EconCCValue value, enum EconCC.Mode mode=EconCC.Mode.Short) -> String
Formats the EconCCValue or EconCCRangedValue (EconCCRangedValue is converted to EconCCValue using #valueFromRange). Each mode has its own special formatting:

```javascript
    // Trailing auto
    // Step disabled
    em.format({value: 100, currency: 'ref'});```

* Short: `100.00 ref`
* Long: `100.00 ref (5.88 keys, 1.09 buds, $11.50)`
* ShortRange: `100.00 ref`
* LongRange: `100.00 ref (5.88 keys, 1.09 buds, $11.50)`
* Label: `1.09 buds`

```javascript
em.format({low: 100, high: 200, currency: 'ref'});```

* Short: `150.00 ref`
* Long: `150.00 ref (8.82 keys, 1.64 buds, $17.25)`
* ShortRange: `100.00–200.00 ref`
* LongRange: `100.00–200.00 ref (8.82 keys, 1.64 buds, $17.25)`

```javascript
    // Step enabled
    em.format({value: 100, currency: 'ref'});```

* Short: `100.00 ref`
* Long: `100.00 ref (5.9 keys, 1.1 buds, $11.50)`
* Label: `1.1 buds`

Important to note: the range separator is not - (HYPHEN-MINUS U+002D) but instead – (EN DASH U+2013).

##### #formatRange(EconCCRangedValue value, enum EconCC.Mode mode=EconCC.Mode.Short) -> String
Like #formatCurrencyRange, but includes any formatting by #format by calling #format up to two times, each time with an EconCCValue (based on low/high). Example:

```javascript
    // Trailing auto
    // Step disabled
    em.formatRange({low: 100, high: 200, currency: 'ref'});
```

* Long: `100.00 ref (5.88 keys, 1.09 buds, $11.50) – 200.00 ref (11.76 keys, 2.19 buds, $23.00)`

Behaves exactly like #format when there's no {value.high}.

Important to note: the range separator is not - (HYPHEN-MINUS U+002D) but instead – (EN DASH U+2013).
