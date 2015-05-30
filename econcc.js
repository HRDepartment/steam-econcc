(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define("EconCC", ["exports", "module"], function (exports, module) {
            factory(exports);
            module.exports = exports["default"];
        });
    } else if (typeof exports !== "undefined") {
        factory(exports);
        module.exports = exports["default"];
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.EconCC = mod.exports["default"];
    }
})(this, function (exports) {
    "use strict";

    var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

    var nondec = /[^\d\.\-e+]/g;
    var doubledash = /--/g;

    var EconCC = (function () {
        function EconCC(currencies, type) {
            for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                args[_key - 2] = arguments[_key];
            }

            _classCallCheck(this, EconCC);

            this.currencies = {};
            this.aliases = {};
            this.step = EconCC.Disabled;
            this.trailing = EconCC.Auto;
            this.range = EconCC.Range.Low;
            this.separators = { thousand: ",", decimal: "." };

            if (typeof currencies === "object") {
                if (currencies.convert !== false) {
                    type = type || "backpackTF";
                    this.convert.apply(this, [type, currencies].concat(args));
                } else {
                    this.modify(currencies);
                }
            }
        }

        EconCC.prototype.modify = function modify() {
            var state = arguments[0] === undefined ? {} : arguments[0];

            function copy(o) {
                var c = {};

                for (var v in o) {
                    if (typeof o[v] === "object" && Object.prototype.toString.call(o[v]) !== "[object Array]") {
                        c[v] = copy(o[v]);
                    } else {
                        c[v] = o[v];
                    }
                }

                return c;
            }

            function patch(val, withVal) {
                var c = copy(val);

                for (var v in withVal) {
                    var wv = withVal[v];

                    if (typeof wv === "object" && Object.prototype.toString.call(wv) !== "[object Array]") {
                        c[v] = patch(c[v] || {}, wv);
                    } else {
                        c[v] = wv;
                    }
                }

                return c;
            }

            for (var _name in state) {
                var val = state[_name];
                var _self = this[_name];

                if (_name === "convert") continue;
                if (val !== undefined && typeof _self !== "undefined" && typeof _self !== "function") {
                    if (typeof val === "object") {
                        this[_name] = patch(_self, val);
                    } else {
                        this[_name] = val;
                    }
                }

                if (_name === "currencies") this.update();
            }

            return this;
        };

        EconCC.prototype.convert = function convert(type) {
            for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
            }

            var converter = EconCC.converters[type];

            if (!converter) {
                throw new Error("Unknown converter (" + converter + ") | Converters: " + Object.keys(EconCC.converters));
            }

            var converted = converter.apply(undefined, args);
            for (var _name2 in converted) {
                if (_name2 !== "convert") {
                    this[_name2] = converted[_name2];
                }
            }

            return this.update();
        };

        EconCC.prototype.update = function update() {
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
                        mid *= next.high ? EconCC._floatdiv(next.low + next.high, 2, next.round) : next.low;
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
        };

        EconCC.prototype.valueFromRange = function valueFromRange(value) {
            var currency = arguments[1] === undefined ? value.currency : arguments[1];
            return (function () {
                var res = { currency: currency };

                if (typeof value.value !== "undefined") {
                    res.value = value.value;
                    return res;
                }

                switch (this.range) {
                    case EconCC.Range.Low:
                        res.value = value.low;
                        break;
                    case EconCC.Range.Mid:
                        res.value = value.high ? EconCC._floatdiv(value.low + value.high, 2, this._gc(currency).round) : value.low;
                        break;
                    case EconCC.Range.High:
                        res.value = value.high || value.low;
                        break;
                }

                return res;
            }).apply(this, arguments);
        };

        EconCC.prototype._rc = function _rc(currency) {
            var co = typeof currency === "object" && currency.internal && this.currencies[currency.internal] ? currency : undefined;
            return this.aliases[currency] ? this.currencies[this.aliases[currency]] : this.currencies[currency] || co;
        };

        EconCC.prototype._gc = function _gc(currency) {
            var cur = this._rc(currency);

            if (!cur || typeof cur !== "object") {
                throw new TypeError("no such currency: " + currency + " | currencies: " + Object.keys(this.currencies) + " / aliases: " + Object.keys(this.aliases));
            }

            return cur;
        };

        EconCC.prototype._vv = function _vv(value) {
            if (typeof value === "object") {
                if (typeof value.low === "number") {
                    return this.valueFromRange(value).value;
                } else if (typeof value.value === "number") {
                    return value.value;
                } else {
                    return 0;
                }
            }

            return value || 0;
        };

        EconCC._floatdiv = function _floatdiv(a, b) {
            var acc = arguments[2] === undefined ? 2 : arguments[2];
            var round = arguments[3] === undefined ? null : arguments[3];

            var p = Math.pow(10, acc < 2 ? 2 : acc);
            var fn = round || function (n) {
                return n;
            };

            return fn(a * p / b) / p;
        };

        EconCC.prototype._brt = function _brt(currency) {
            return currency._bc[EconCC.RangeTag[this.range]];
        };

        EconCC.prototype._sepnum = function _sepnum(num) {
            return ("" + num).replace(/\B(?=(\d{3})+(?!\d))/g, this.separators.thousand).replace(/\./g, this.separators.decimal);
        };

        EconCC.prototype.scope = function scope(state, fn) {
            var self = { currencies: this.currencies, aliases: this.aliases, range: this.range, step: this.step, trailing: this.trailing, separators: this.separators };

            this.modify(state);
            fn(this);
            return this.modify(self);
        };

        EconCC.prototype.isCurrency = function isCurrency(cur) {
            if (typeof cur === "object") {
                if (cur.currency) cur = cur.currency;else if (!cur.internal) {
                    return false;
                }
            }

            return !!this._rc(cur);
        };

        EconCC.prototype.convertToBC = function convertToBC(value) {
            var currency = arguments[1] === undefined ? value.currency : arguments[1];
            return (function () {
                var cur = this._gc(currency);
                var val = this._vv(value);

                return !cur || cur.bc || cur.rwc ? val : val * this._brt(cur);
            }).apply(this, arguments);
        };

        EconCC.prototype.convertFromBC = function convertFromBC(value) {
            var currency = arguments[1] === undefined ? value.currency : arguments[1];
            return (function () {
                var cur = this._gc(currency);
                var val = this._vv(value);

                return !cur || cur.bc || cur.rwc ? val : EconCC._floatdiv(val, this._brt(cur), cur.round);
            }).apply(this, arguments);
        };

        EconCC.prototype.convertToCurrency = function convertToCurrency(value, oldc, newc) {
            if (arguments.length === 2) {
                newc = oldc;
                oldc = value.currency;
            }

            var oldcc = this._gc(oldc);

            newc = this._gc(newc);
            value = this._vv(value);

            var ret = { currency: newc.internal };
            if (oldcc.rwc) value = EconCC._floatdiv(value, this._brt(oldcc), oldcc.round);
            if (newc.bc) {
                ret.value = this.convertToBC(value, oldc);
            } else if (newc.rwc) {
                ret.value = this.convertToBC(value, oldc) * this._brt(newc);
            } else {
                ret.value = this.convertFromBC(this.convertToBC(value, oldc), newc);
            }

            return ret;
        };

        EconCC.prototype.formatCurrencyRange = function formatCurrencyRange(value) {
            if (value.high) {
                var _name3 = false;
                var cur = this._gc(value.currency);

                if (cur.pos.sym === "start") _name3 = true;
                return this.formatCurrency(value.low, value.currency, _name3) + "–" + this.formatCurrency(value.high, value.currency, !_name3);
            }

            return this.formatCurrency(value.low, value.currency);
        };

        EconCC.prototype.formatCurrency = function formatCurrency(value) {
            var currency = arguments[1] === undefined ? value.currency : arguments[1];
            var name = arguments[2] === undefined ? true : arguments[2];
            return (function () {
                var cur = this._gc(currency);
                var str = "",
                    val = +this._vv(value).toFixed(cur.round);
                var trailing = cur.rwc || this.trailing === EconCC.Auto ? cur.trailing : this.trailing;

                if (this.step !== EconCC.Disabled && cur.step && val >= cur.step) {
                    val = (Math.floor(val) + EconCC._floatdiv(Math.round(val % 1 / cur.step), Math.floor(1 / cur.step), cur.round, Math.floor)).toFixed(cur.round);
                    if (!trailing) val = +val;
                } else {
                    if (trailing) {
                        val = val.toFixed(cur.round);
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
        };

        EconCC.prototype.parse = function parse(str) {
            var parts = str.split(" ");
            var range = (parts[0] || "").split(/-|–/);
            var mode = (parts[1] || "").split(":");
            var currency = mode[0];
            var fmtmode = mode[1];

            if (!this.isCurrency(currency)) {
                for (var cname in this.currencies) {
                    var cur = this.currencies[cname];
                    var sym = cur.symbol;

                    if (!sym) continue;
                    var pos = cur.pos.sym;
                    var start = (range[0] || "")[0];
                    var end = range[1] ? range[1].slice(-1) : "";

                    if (pos === "start" && sym === start || pos === "end" && sym === end) {
                        currency = cname;
                        break;
                    }
                }
            }

            if (!fmtmode) {
                fmtmode = range[range.length - 1].split(":")[1];
            }

            return {
                currency: currency,
                low: Number(range[0].replace(doubledash, "00").replace(nondec, "")),
                high: range[1] ? Number(range[1].replace(doubledash, "00").replace(nondec, "")) : undefined,
                mode: EconCC.Mode[fmtmode]
            };
        };

        EconCC.prototype.f = function f(str) {
            var value = this.parse(str);
            return this.format(value, value.mode);
        };

        EconCC.prototype.format = function format(value) {
            var mode = arguments[1] === undefined ? EconCC.Mode.Short : arguments[1];

            var primary = undefined;

            if (mode === EconCC.Mode.ShortRange || mode === EconCC.Mode.LongRange) {
                primary = this.formatCurrencyRange(value);
                if (value.low || !value.value) value = this.valueFromRange(value);
            } else {
                if (value.low || !value.value) value = this.valueFromRange(value);
                primary = this.formatCurrency(value);
            }

            if (mode === EconCC.Mode.Short || mode === EconCC.Mode.ShortRange) {
                return primary;
            }

            var vc = this._gc(value.currency);
            var fmt = [];
            var donecur = {};
            var label = mode === EconCC.Mode.Label;
            var threshold = label ? 1 : 0.8;

            if (label) {
                fmt.push({ str: primary, cvalue: this._brt(vc) });
            }

            donecur[vc.internal] = true;
            for (var cname in this.currencies) {
                var cur = this.currencies[cname];

                if (cur.internal === value.currency || donecur[cname] || label && !cur.label || !label && cur.hidden) {
                    continue;
                }

                var val = this.convertToCurrency(value, value.currency, cur);
                if (!cur.rwc && val.value < threshold) {
                    continue;
                }

                var obj = { str: this.formatCurrency(val), fmt: cur.pos.fmt };

                if (label) {
                    obj.cvalue = this._brt(cur);
                }

                donecur[cname] = true;
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
        };

        EconCC.prototype.formatRange = function formatRange(value) {
            var mode = arguments[1] === undefined ? EconCC.Mode.Short : arguments[1];

            var cur = value.currency;
            return this.format({ currency: cur, value: value.low }, mode) + (value.high ? " – " + this.format({ currency: cur, value: value.high }, mode) : "");
        };

        EconCC.prototype.scm = function scm(val) {
            var mode = arguments[1] === undefined ? EconCC.SCM.Buyer : arguments[1];
            var fees = arguments[2] === undefined ? {} : arguments[2];

            var _valueFromRange = this.valueFromRange(val);

            var value = _valueFromRange.value;
            var currency = _valueFromRange.currency;

            var buyer = { currency: currency };
            var seller = { currency: currency };

            if (mode === EconCC.SCM.Buyer) {
                var fee = EconCC.stmCalculateFee(value * 100, fees);
                var svalue = Math.max(EconCC._floatdiv(fee.cents - fee.fees, 100), 0.01);

                buyer.value = value;
                seller.value = svalue;
            } else if (mode === EconCC.SCM.Seller) {
                seller.value = value;
                buyer.value = Math.max(EconCC._floatdiv(EconCC.stmCalculateInclFee(value * 100, fees).cents, 100), 0.03);
            }

            return { buyer: buyer, seller: seller };
        };

        EconCC.stmCalculateFee = function stmCalculateFee(cents) {
            var _ref = arguments[1] === undefined ? {} : arguments[1];

            var stmFee = _ref.stmFee;
            var publisherFee = _ref.publisherFee;
            var baseFee = _ref.baseFee;
            var minFee = _ref.minFee;

            stmFee = typeof stmFee === "number" ? stmFee : 0.05;
            publisherFee = typeof publisherFee === "number" ? publisherFee : 0.1;
            baseFee = typeof baseFee === "number" ? baseFee : 0;
            minFee = typeof minFee === "number" ? minFee : 1;

            var wallet = { stmFee: stmFee, publisherFee: publisherFee, baseFee: baseFee, minFee: minFee };
            var receiver = Math.floor((cents - baseFee) / (stmFee + publisherFee + 1));
            var fees = EconCC.stmCalculateInclFee(receiver, wallet);
            var undershot = false;
            var iter = 0;

            while (fees.cents !== cents && iter < 50) {
                if (fees.cents > cents) {
                    if (undershot) {
                        fees = EconCC.stmCalculateInclFee(receiver - 1, wallet);
                        fees.steamFee += Math.floor(cents - fees.cents);
                        fees.fees += Math.floor(cents - fees.cents);
                        fees.cents = cents;
                        break;
                    } else {
                        receiver -= 1;
                    }
                } else {
                    undershot = true;
                    receiver += 1;
                }

                fees = EconCC.stmCalculateInclFee(receiver, wallet);
                iter += 1;
            }

            return fees;
        };

        EconCC.stmCalculateInclFee = function stmCalculateInclFee(funds) {
            var _ref2 = arguments[1] === undefined ? {} : arguments[1];

            var stmFee = _ref2.stmFee;
            var publisherFee = _ref2.publisherFee;
            var baseFee = _ref2.baseFee;
            var minFee = _ref2.minFee;

            stmFee = typeof stmFee === "number" ? stmFee : 0.05;
            publisherFee = typeof publisherFee === "number" ? publisherFee : 0.1;
            baseFee = typeof baseFee === "number" ? baseFee : 0;
            minFee = typeof minFee === "number" ? minFee : 1;

            var steamFee = Math.floor(Math.floor(Math.max(funds * stmFee, minFee)) + baseFee);
            var pubFee = Math.floor(publisherFee > 0 ? Math.max(funds * publisherFee, 1) : 0);
            var fees = steamFee + pubFee;

            return { steamFee: steamFee, publisherFee: pubFee, fees: fees, cents: funds + fees };
        };

        EconCC.makeCurrency = function makeCurrency(type, _ref3) {
            var internal = _ref3.internal;
            var trailing = _ref3.trailing;
            var low = _ref3.low;
            var high = _ref3.high;
            var round = _ref3.round;
            var hidden = _ref3.hidden;
            var label = _ref3.label;
            var symbol = _ref3.symbol;
            var pos = _ref3.pos;
            var currency = _ref3.currency;
            var names = _ref3.names;
            var step = _ref3.step;

            if (typeof round === "undefined") round = 2;
            var cur = { internal: internal, trailing: trailing, low: low, high: high, round: round, hidden: hidden, label: label, pos: pos };

            if (type === "gc" || type === "bc") {
                if (type === "bc") {
                    cur.bc = true;
                } else {
                    cur.currency = currency;
                }

                cur.names = names;
                cur.step = step;
            } else if (type === "rwc") {
                cur.rwc = true;
                cur.symbol = symbol;

                if (typeof cur.trailing === "undefined") cur.trailing = true;
            }

            return cur;
        };

        return EconCC;
    })();

    var Converters = {
        backpackTFItem: function backpackTFItem(price) {
            return { currency: price.currency, low: price.value, high: price.value_high };
        },
        backpackTF: function backpackTF(currencies) {
            if (currencies.response) currencies = currencies.response;
            if (currencies.currencies) currencies = currencies.currencies;

            var aliases = {};
            var pos = 0;
            var currs = {
                usd: EconCC.makeCurrency("rwc", {
                    internal: "usd",
                    symbol: "$",
                    pos: { sym: "start", fmt: 99 }
                })
            };

            for (var cname in currencies) {
                var cobj = currencies[cname];
                var iprice = cobj.price;
                var hidden = cobj.blanket || cobj.hidden;

                if (cname === "earbuds") hidden = true;

                var curn = currs[cname] = {
                    internal: cname,
                    currency: iprice.currency,
                    low: iprice.value,
                    high: iprice.value_high,
                    names: [cobj.single, cobj.plural],
                    round: cobj.round,
                    pos: { fmt: pos },
                    hidden: !!hidden,
                    label: !hidden,
                    trailing: false
                };

                aliases[cobj.single] = aliases[cobj.plural] = cname;
                if (cname === "metal") {
                    curn.bc = true;
                    curn.step = 0.055;
                    curn.trailing = true;

                    currs.usd.low = iprice.value;
                    currs.usd.high = iprice.value_high;
                } else if (cname === "earbuds" || cname === "keys") {
                    curn.step = 0.05;
                }

                pos += 1;
            }

            return { currencies: currs, range: EconCC.Range.Mid, aliases: aliases, convert: false };
        },
        backpackSCM: function backpackSCM(items, spec, rwc) {
            var notax = arguments[3] === undefined ? false : arguments[3];

            if (items.response) items = items.response;
            if (items.items) items = items.items;

            var aliases = {};
            var pos = 0;
            var currs = {};

            if (!rwc) {
                rwc = EconCC.makeCurrency("rwc", {
                    internal: "usd",
                    symbol: "$",
                    pos: { sym: "start", fmt: 99 }
                });
            }

            currs[rwc.internal] = rwc;

            var fees = typeof notax === "object" ? notax : {};

            for (var iname in spec) {
                var item = spec[iname];
                var iinternal = item.internal;
                var inames = item.names;
                var iround = item.round;
                var itrailing = item.trailing;
                var ihidden = item.hidden;
                var ilabel = item.label;
                var ipos = item.pos;
                var ibc = item.bc;
                var irwc = item.rwc;

                if (typeof inames === "string") inames = [inames, inames];
                if (!ipos) ipos = { fmt: pos };

                var cents = items[iname].value;
                if (notax) {
                    cents -= EconCC.stmCalculateFee(cents, fees).fees;
                }

                var price = cents / 100;

                if (ibc && !rwc.low) rwc.low = price;
                currs[iinternal] = {
                    internal: iinternal,
                    names: inames,
                    currency: rwc.internal,
                    round: iround || 2,
                    trailing: itrailing || false,
                    hidden: ihidden || false,
                    label: ilabel || false,
                    low: price,
                    pos: ipos,
                    bc: ibc || false,
                    rwc: irwc || false
                };

                pos += 1;
            }

            for (var icur in currs) {
                var cur = currs[icur];

                if (cur.bc || cur.rwc) continue;
                cur.low = cur.low / rwc.low;
            }

            return { currencies: currs, range: EconCC.Range.Mid, aliases: aliases, convert: false };
        }
    };

    EconCC.converters = Converters;

    EconCC.Range = { Low: 0, Mid: 1, High: 2 };
    EconCC.Mode = { Short: 1, Long: 2, ShortRange: 3, LongRange: 4, Label: 5 };
    EconCC.SCM = { Buyer: 1, Seller: 2 };
    EconCC.RangeTag = ["low", "mid", "high"];
    EconCC.Auto = 2;
    EconCC.Enabled = 1;
    EconCC.Disabled = 0;

    exports["default"] = EconCC;
});

