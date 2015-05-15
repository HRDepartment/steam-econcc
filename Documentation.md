## require
require('econcc') returns the EconCC class.
An instance must be created using new: new EconCC(...)

## class EconCC
### Public
##### enum EconCC.Mode
EconCC.Mode.{Short, Long, ShortRange, LongRange, Label}

Formatting is described in [#format](#formateconccrangedvalueeconccvalue-value-enum-econccmode-modeeconccmodeshort---string).

##### enum EconCC.Range
EconCC.Range.{Low, Mid, High}
* Low: Low-end of the range
* Mid: Average of low and high
* High: High-end of the range

##### interface EconCCValue
* Number value: Value in the respective currency.
* String currency: {String currency.internal} of the value.

##### interface EconCCRangedValue
* Number low: Low value.
* Number high?: High value. If not defined, considered equal to low.
* String currency: {String currency.internal} of the value.

##### interface EconCCSCMValue
* EconCCValue seller: What the seller receives from an SCM purchase (with 15% tax applied)
* EconCCValue buyer: What the buyer has to pay for an SCM purchase

##### interface EconCCCurrencySpecification
Shared (real world currency and game currency)

* String internal: Internal name of the currency, the key of the object in an EconCC instance's currencies object.
* Boolean trailing: Whether this currency accepts trailing zeros. (used by EconCC.Auto)
* Number low: (RWC: low-end value of how much 1 bc is worth in the currency; GC: low-end value of the currency)
* Number high: High-end value of the above.
* Number round: How many decimal places this currency should be rounded to.
* Boolean hidden: Whether this currency is hidden in extended formatting (Mode = Long).
* Boolean label: Whether this currency is shown in labels (Mode = Label).
* Object _bc{Number low, Number mid, Number high}: (RWC: equivalent to .low/.high; GC: How much 1 of this currency is worth in the BC.) (updated by #update())

RWC-specific

* Boolean rwc: Whether this currency is an RWC.
* String symbol: Symbol used to identify the currency.
* Object pos{String sym, Number fmt}: Position of the symbol ("start"/"end" of the number) and format order. (lower is better)

GC-specific

* String currency: Internal name of the currency this currency is priced in.
* Array names[String singular, String plural]: Name of the currency. (singular/plural)
* Boolean bc: Whether this currency is the BC. (BC-only)
* Number step: Step value of the currency. Decimals are rounded to the nearest (step). (step = 0.055; 0.06 -> 0.05, 0.90 -> 0.88, 0.32 -> 0.33)
* Object pos{Number fmt}: Format order. (lower is better)

##### typedef EconCCCurrency EconCCCurrencySpecification|String
A currency alias, a currency's {currency.internal}, or a currency object (in .currencies).

##### typedef EconCCNumberValue Object{Number value}|Number
Value in Number or an Object containg a 'value' property, such as EconCCValue. An EconCCNumberValue as Object can also contain .currency which will be used as currency for functions that require them. Such functions always offer an argument that can be populated manually.

##### EconCC.iFromBackpack(Object item) -> EconCCRangedValue
Converts an item's value in backpack.tf IGetPrices v4 format to EconCC format.
##### EconCC.cFromBackpack(Object currencies, Object pricelist) -> Object
Returns an object containing currencies from backpack.tf's IGetCurrencies(v1)/IGetPrices(v4) APIs in EconCC format. Currently only Team Fortress 2 is supported.

##### #constructor(Object currencies?, Object pricelist?) -> EconCC instance
Initializes this EconCC instance. If pricelist is specified, currencies and pricelist are passed to EconCC.cFromBackpack and imported. Otherwise, currencies (here, poorly named) is passed to #modify (can also be empty).
##### .currencies (Object)
Object containing this instance's currencies (EconCCCurrencySpecification). **Call #update after modifying this object.**
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

##### #scope(Object state, Function fn) -> this
Creates a copy of the current state and calls #modify with the specified state. Objects are partially patched, meaning you will tweak only the values you specify. fn is then called with this instance as first argument. Finally the old state is restored using #modify. This function can be stacked. (#scope inside #scope)

##### #isCurrency(EconCCValue|EconCCRangedValue|EconCCCurrency cur) -> bool
Whether the given currency (or a value's .currency) is a currency registered in this instance. (includes checking aliases)

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

##### #parse(String value) -> EconCCRangedValue
Helper function for #format. value's format is `low-high currency:mode`, examples:
* 1-2 ref:Long
* 1 key:Short
* 1 hat

An additional 'mode' property is available, which contains the computed mode. (mode as int)

##### #f(String value) -> String
Helper function for #format. Parses the value with #parse, and calls #format with the result.

Mode defaults to EconCC.Mode.Short.

##### #scm(EconCCValue|EconCCRangedValue value) -> EconCCSCMValue
Returns what the buyer/seller has to pay for/receives from an SCM purchase. value is casted to an EconCCRangedValue using #valueFromRange.

The EConCCSCMValue's seller property is always a copy of value and never a reference.

##### #format(EconCCRangedValue|EconCCValue value, enum EconCC.Mode mode=EconCC.Mode.Short) -> String
Formats the EconCCValue or EconCCRangedValue (EconCCRangedValue is converted to EconCCValue using #valueFromRange). Each mode has its own special formatting:

```javascript
    // Trailing auto
    // Step disabled
    ec.format({value: 100, currency: 'ref'});
```

* Short: `100.00 ref`
* Long: `100.00 ref (5.88 keys, 1.09 buds, $11.50)`
* ShortRange: `100.00 ref`
* LongRange: `100.00 ref (5.88 keys, 1.09 buds, $11.50)`
* Label: `1.09 buds`

```javascript
    ec.format({low: 100, high: 200, currency: 'ref'});
```

* Short: `150.00 ref`
* Long: `150.00 ref (8.82 keys, 1.64 buds, $17.25)`
* ShortRange: `100.00–200.00 ref`
* LongRange: `100.00–200.00 ref (8.82 keys, 1.64 buds, $17.25)`

```javascript
    // Step enabled
    ec.format({value: 100, currency: 'ref'});
```

* Short: `100.00 ref`
* Long: `100.00 ref (5.9 keys, 1.1 buds, $11.50)`
* Label: `1.1 buds`

Important to note: the range separator is not - (HYPHEN-MINUS U+002D) but instead – (EN DASH U+2013).

##### #formatRange(EconCCRangedValue value, enum EconCC.Mode mode=EconCC.Mode.Short) -> String
Like #formatCurrencyRange, but includes any formatting by #format by calling #format up to two times, each time with an EconCCValue (based on low/high). Example:

```javascript
    // Trailing auto
    // Step disabled
    ec.formatRange({low: 100, high: 200, currency: 'ref'});
```

* Long: `100.00 ref (5.88 keys, 1.09 buds, $11.50) – 200.00 ref (11.76 keys, 2.19 buds, $23.00)`

Behaves exactly like #format when there's no {value.high}.

Important to note: the range separator is not - (HYPHEN-MINUS U+002D) but instead – (EN DASH U+2013).

### Private
Private methods are not guaranteed to be backwards compatible in any way. They can be removed or altered significantly at any time. Lock your version to steam-econcc and upgrade with care if you use them.

##### static _makeRWC(Object{name, symbol, pos, round, low, high}) -> EconCCCurrencySpecification
Creates a real world currency specification.

##### #_rc(EconCCCurrency cur) -> EconCCCurrencySpecification?
Resolves an EconCCCurrency, may return undefined if not found.

##### #_gc(EconCCCurrency cur) throws TypeError -> EconCCCurrencySpecification
Basically #_rc, but throws a TypeError if cur could not be resolved.

##### #_vv(EconCCNumberValue|EconCCRangedValue value) -> Number
Obtains a value object's value, or returns the value if it's a number. Uses #valueFromRange to cast a EconCCRangedValues to EconCCNumberValues.

##### #_floatdiv(Number a, Number b, Number acc, Function<(Number num) -> Number> round) -> Number
Does a floating point division with accuracy acc. Round is defaulted to a function that returns the input, but other functions like Math.round can be passed.

##### #_brt(EconCCCurrencySpecification currency) -> Number
Returns the currency's bc value according to the current .range.

##### #_sepnum(Number num) -> String
Adds thousand and decimal separators to a number.
