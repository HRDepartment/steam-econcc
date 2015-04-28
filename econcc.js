(function () {
"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var EconCC = (function () {
    function EconCC(currencies, pricelist) {
        _classCallCheck(this, EconCC);

        this.currencies = {};
        this.aliases = {};
        this.step = EconCC.Disabled;
        this.trailing = EconCC.Auto;
        this.range = EconCC.Range.Low;
        this.separators = { thousand: ",", decimal: "." };

        if (typeof currencies === "object") {
            if (typeof pricelist === "object") {
                // fromBackpack shorthand
                this.modify(EconCC.cFromBackpack(currencies, pricelist));
            } else {
                // initialize with object
                this.modify(currencies);
            }
        }
    }

    _createClass(EconCC, [{
        key: "modify",
        value: function modify() {
            var _ref = arguments[0] === undefined ? {} : arguments[0];

            var currencies = _ref.currencies;
            var aliases = _ref.aliases;
            var range = _ref.range;
            var step = _ref.step;
            var trailing = _ref.trailing;
            var separators = _ref.separators;

            if (currencies !== undefined) {
                this.currencies = currencies;
                this.update();
            }
            if (aliases !== undefined) this.aliases = aliases;
            if (range !== undefined) this.range = range || EconCC.Range.Low;
            if (step !== undefined) this.step = step;
            if (trailing !== undefined) this.trailing = trailing;
            if (separators !== undefined) this.separators = separators;

            return this;
        }
    }, {
        key: "update",
        value: function update() {
            for (var cname in this.currencies) {
                var cur = this.currencies[cname];

                var low = cur.low;
                var mid = undefined,
                    high = undefined;

                if (cur.high) {
                    mid = (low + cur.high) / 2;
                    high = cur.high;
                }

                var next = this.currencies[cur.currency];
                while (next && !(next.bc || next.rwc)) {
                    low *= next.low;
                    if (high) {
                        mid *= next.high ? (next.low + next.high) / 2 : next.low;
                        high *= next.high || next.low;
                    }

                    next = this.currencies[next.currency];
                }

                if (!high) {
                    high = mid = low;
                }

                cur._bc = { low: low, mid: mid, high: high };
            }

            return this;
        }
    }, {
        key: "valueFromRange",
        value: function valueFromRange(value) {
            var currency = arguments[1] === undefined ? value.currency : arguments[1];
            return (function () {
                var res = { currency: currency };

                switch (this.range) {
                    case EconCC.Range.Low:
                        res.value = value.low;
                        break;
                    case EconCC.Range.Mid:
                        res.value = value.high ? (value.low + value.high) / 2 : value.low;
                        break;
                    case EconCC.Range.High:
                        res.value = value.high || value.low;
                        break;
                }

                return res;
            }).apply(this, arguments);
        }
    }, {
        key: "_gc",
        value: function _gc(currency) {
            var cur = this.aliases[currency] ? this.currencies[this.aliases[currency]] : this.currencies[currency] || currency;

            if (!cur || typeof cur !== "object") {
                throw new Error("no such currency: " + currency + " | currencies: " + Object.keys(this.currencies) + " / aliases: " + Object.keys(this.aliases));
            }

            return cur;
        }
    }, {
        key: "_rt",
        value: function _rt() {
            return EconCC.RangeTag[this.range];
        }
    }, {
        key: "_sepnum",
        value: function _sepnum(num) {
            return ("" + num).replace(/\B(?=(\d{3})+(?!\d))/g, this.separators.thousand).replace(/\./g, this.separators.decimal);
        }
    }, {
        key: "convertToBC",
        value: function convertToBC(value) {
            var currency = arguments[1] === undefined ? value.currency : arguments[1];
            return (function () {
                currency = this._gc(currency);
                value = typeof value === "object" ? value.value : value;

                return !currency || currency.bc || currency.rwc ? value : value * currency._bc[this._rt()];
            }).apply(this, arguments);
        }
    }, {
        key: "convertFromBC",
        value: function convertFromBC(value) {
            var currency = arguments[1] === undefined ? value.currency : arguments[1];
            return (function () {
                currency = this._gc(currency);
                value = typeof value === "object" ? value.value : value;

                return !currency || currency.bc || currency.rwc ? value : value / currency._bc[this._rt()];
            }).apply(this, arguments);
        }
    }, {
        key: "convertToCurrency",
        value: function convertToCurrency(value, oldc, newc) {
            if (arguments.length === 2) {
                newc = oldc;
                oldc = value.currency;
            }

            var oldcc = this._gc(oldc);

            newc = this._gc(newc);
            value = typeof value === "object" ? value.value : value || 0;

            var ret = { currency: newc.internal };
            if (oldcc.rwc) value = value / oldcc._bc[this._rt()];
            if (newc.bc) {
                ret.value = this.convertToBC(value, oldc);
            } else if (newc.rwc) {
                ret.value = this.convertToBC(value, oldc) * newc._bc[this._rt()];
            } else {
                ret.value = this.convertFromBC(this.convertToBC(value, oldc), newc);
            }

            return ret;
        }
    }, {
        key: "formatCurrencyRange",
        value: function formatCurrencyRange(value) {
            if (value.high) {
                var _name = false;
                var cur = this._gc(value.currency);

                // $1.00–2.00
                // 1.00–2.00 ref
                if (cur.pos.sym === "start") _name = true;
                return this.formatCurrency(value.low, value.currency, _name) + "–" + this.formatCurrency(value.high, value.currency, !_name);
            }

            return this.formatCurrency(value.low, value.currency);
        }
    }, {
        key: "formatCurrency",
        value: function formatCurrency(value) {
            var currency = arguments[1] === undefined ? value.currency : arguments[1];
            var name = arguments[2] === undefined ? true : arguments[2];
            return (function () {
                var cur = this._gc(currency);
                var str = "",
                    val = +(typeof value === "number" ? value : value.value).toFixed(cur.round);
                var trailing = cur.rwc || this.trailing === EconCC.Auto ? cur.trailing : this.trailing;

                if (this.step !== EconCC.Disabled && cur.step && val > cur.step) {
                    var decimal = Math.round(val % 1 / cur.step) * cur.step;
                    if (decimal === cur.step) decimal = Math.floor(decimal * 100) / 100;
                    val = (Math.floor(val) + decimal).toFixed(cur.round);

                    if (!trailing) val = +val;
                } else {
                    // separated for readability
                    if (trailing) {
                        val = val.toFixed(cur.round); // Add back any trailing zeros
                    }
                }

                val = this._sepnum(val);
                if (!name) return val;
                if (cur.rwc) {
                    switch (cur.pos.sym) {
                        case "start":
                            str = cur.symbol + val;
                            break;
                        case "end":
                            str = val + cur.symbol;
                            break;
                    }
                } else {
                    str = val + " " + cur.names[+(value.value !== 1)];
                }

                return str;
            }).apply(this, arguments);
        }
    }, {
        key: "f",

        // Helper for consumers
        value: function f(str) {
            var parts = str.split(" "),
                range = parts[0].split("-"),
                mode = parts[1].split(":");

            return this.format({ currency: mode[0], low: +range[0].replace(/,/g, ""), high: range[1] ? +range[1].replace(/,/g, "") : undefined }, EconCC.Mode[mode[1]]);
        }
    }, {
        key: "format",
        value: function format(value) {
            var mode = arguments[1] === undefined ? EconCC.Mode.Short : arguments[1];

            var primary = undefined;

            if (mode === EconCC.Mode.ShortRange || mode === EconCC.Mode.LongRange) {
                primary = this.formatCurrencyRange(value);
                if (value.low || value.high || !value.value) {
                    value = this.valueFromRange(value);
                }
            } else {
                if (value.low || value.high || !value.value) {
                    value = this.valueFromRange(value);
                }

                primary = this.formatCurrency(value);
            }

            if (mode === EconCC.Mode.Short || mode === EconCC.Mode.ShortRange) {
                return primary;
            }

            var fmt = [];
            var label = mode === EconCC.Mode.Label;
            var threshold = label ? 1 : 0.8;

            if (label) {
                fmt.push({ str: primary, cvalue: this._gc(value.currency)._bc[this._rt()] });
            }

            for (var cname in this.currencies) {
                var cur = this.currencies[cname];

                if (cur.hidden || cur.internal === value.currency) {
                    continue;
                }

                var val = this.convertToCurrency(value, value.currency, cur);
                if (!cur.rwc && val.value < threshold) {
                    continue;
                }

                var obj = { str: this.formatCurrency(val), fmt: cur.pos.fmt };

                if (label) {
                    obj.cvalue = this._gc(val.currency)._bc[this._rt()];
                }

                fmt.push(obj);
            }

            if (label) {
                fmt.sort(function (a, b) {
                    var cv = b.cvalue - a.cvalue;

                    if (cv === 0) {
                        return b.fmt - a.fmt;
                    }
                    return cv;
                });
                return fmt[0].str;
            }

            fmt.sort(function (a, b) {
                return a.fmt - b.fmt;
            });
            return primary + (fmt.length ? " (" + fmt.map(function (o) {
                return o.str;
            }).join(", ") + ")" : "");
        }
    }, {
        key: "formatRange",
        value: function formatRange(value) {
            var mode = arguments[1] === undefined ? EconCC.Mode.Short : arguments[1];

            var cur = value.currency;
            return this.format({ currency: cur, value: value.low }) + (value.high ? " – " + this.format({ currency: cur, value: value.high }) : "");
        }
    }], [{
        key: "makeCurrency",
        value: function makeCurrency(_ref2) {
            var name = _ref2.name;
            var symbol = _ref2.symbol;
            var pos = _ref2.pos;
            var round = _ref2.round;
            var low = _ref2.low;
            var high = _ref2.high;

            return {
                internal: name,
                rwc: true,
                trailing: true,
                // How much 1 BC is worth in this currency
                low: low || 0,
                high: high || 0,
                symbol: symbol,
                pos: pos,
                round: round
            };
        }
    }, {
        key: "iFromBackpack",
        value: function iFromBackpack(price) {
            return { currency: price.currency, low: price.value, high: price.value_high };
        }
    }, {
        key: "cFromBackpack",
        value: function cFromBackpack(currencies, pricelist) {
            var c = currencies;

            if (c.response) c = c.response;

            switch (c.name) {
                //case "Team Fortress 2":
                default:
                    return EconCC.cFromBackpackTF(currencies, pricelist);
            }
        }
    }, {
        key: "cFromBackpackTF",
        value: function cFromBackpackTF(currencies, pricelist) {
            if (currencies.response) currencies = currencies.response;
            if (currencies.currencies) currencies = currencies.currencies;

            if (pricelist.response) pricelist = pricelist.response;
            if (pricelist.items) pricelist = pricelist.items;

            var plistkeys = Object.keys(pricelist);
            var currs = {
                usd: EconCC.makeCurrency({
                    name: "usd",
                    symbol: "$",
                    pos: { sym: "start", fmt: 99 },
                    round: 2
                })
            };
            var aliases = {};

            var pos = 0;
            for (var cname in currencies) {
                var cobj = currencies[cname];
                var plist = undefined;

                for (var i = 0, len = plistkeys.length; i < len; i += 1) {
                    var item = pricelist[plistkeys[i]];
                    if (item.defindex[0] === cobj.defindex) {
                        plist = item;
                        break;
                    }
                }

                if (!plist) throw new Error("Unknown defindex " + cobj.defindex + " not in pricelist");

                var iprice = plist.prices[cobj.quality][cobj.tradable][cobj.craftable][0];
                var curn = currs[cname] = {
                    internal: cname,
                    currency: iprice.currency,
                    low: iprice.value,
                    high: iprice.value_high,
                    names: [cobj.single, cobj.plural],
                    round: cobj.round,
                    pos: { fmt: pos },
                    hidden: !!cobj.blanket,
                    trailing: false
                };

                aliases[cobj.single] = aliases[cobj.plural] = cname;

                pos += 1;
                if (cname === "metal") {
                    curn.bc = true; // base currency
                    curn.step = 0.055;
                    curn.trailing = true;

                    currs.usd.low = iprice.value;
                    currs.usd.high = iprice.value_high;
                } else if (cname === "earbuds" || cname === "keys") {
                    curn.step = 0.05;
                }
            }

            return { currencies: currs, range: EconCC.Range.Mid, aliases: aliases };
        }
    }]);

    return EconCC;
})();

EconCC.Range = { Low: 0, Mid: 1, High: 2 };
EconCC.Mode = { Short: 1, Long: 2, ShortRange: 3, LongRange: 4, Label: 5 };
EconCC.RangeTag = ["low", "mid", "high"];
EconCC.Auto = 2;
EconCC.Enabled = 1;
EconCC.Disabled = 0;

// Export
if (typeof module === "object" && module.exports) {
    module.exports = EconCC;
} else if (typeof define === "function" && define.amd) {
    define([], EconCC);
} else {
    var glob = (function () {
        return this;
    }).apply(null);

    if (typeof global === "object") glob = global;else if (typeof window === "object") glob = window;else if (typeof self === "object") glob = self;

    glob.EconCC = EconCC;
}

}());
