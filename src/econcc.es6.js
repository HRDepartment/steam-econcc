let nondec = /[^\d\.\-e+]/g;
let doubledash = /--/g;

class EconCC {
    constructor(currencies, type, ...args) {
        this.currencies = {};
        this.aliases = {};
        this.step = EconCC.Disabled;
        this.trailing = EconCC.Auto;
        this.range = EconCC.Range.Low;
        this.separators = {thousand: ",", decimal: "."};

        if (typeof currencies === 'object') {
            if (currencies.convert !== false) {
                type = type || "backpackTF";
                this.convert(type, currencies, ...args);
            } else { // initialize with object
                this.modify(currencies);
            }
        }
    }

    modify(state={}) {
        function copy(o) {
            let c = {};

            for (let v in o) {
                if (typeof o[v] === 'object' && Object.prototype.toString.call(o[v]) !== '[object Array]') {
                    c[v] = copy(o[v]);
                } else {
                    c[v] = o[v];
                }
            }

            return c;
        }

        function patch(val, withVal) {
            let c = copy(val);

            for (let v in withVal) {
                let wv = withVal[v];

                if (typeof wv === 'object' && Object.prototype.toString.call(wv) !== '[object Array]') {
                    c[v] = patch(c[v] || {}, wv);
                } else {
                    c[v] = wv;
                }
            }

            return c;
        }

        for (let name in state) {
            let val = state[name];
            let self = this[name];

            if (name === 'convert') continue;
            if (val !== undefined && typeof self !== 'undefined' && typeof self !== 'function') {
                if (typeof val === 'object') {
                    this[name] = patch(self, val);
                } else {
                    this[name] = val;
                }
            }

            if (name === 'currencies') this.update();
        }

        return this;
    }

    convert(type, ...args) {
        let converter = EconCC.converters[type];

        if (!converter) {
            throw new Error("Unknown converter (" + converter + ") | Converters: " + Object.keys(EconCC.converters));
        }

        let converted = converter(...args);
        for (let name in converted) { // .currencies, .range, etc.
            if (name !== 'convert') {
                this[name] = converted[name];
            }
        }

        return this.update();
    }

    update() {
        for (let cname in this.currencies) {
            let cur = this.currencies[cname];

            let low = cur.low;
            let mid, high;

            if (cur.high) {
                mid = (low + cur.high) / 2;
                high = cur.high;
            }

            let next = this.currencies[cur.currency];
            while (next && !(next.bc || next.rwc)) {
                low *= next.low;
                if (high) {
                    mid *= (next.high ? EconCC._floatdiv(next.low + next.high, 2, next.round) : next.low);
                    high *= next.high || next.low;
                }

                next = this.currencies[next.currency];
            }

            if (!high) {
                high = mid = low;
            }

            cur._bc = {low, mid, high};
        }

        return this;
    }

    valueFromRange(value, currency=value.currency) {
        let res = {currency};

        if (typeof value.value !== 'undefined') {
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
    }

    _rc(currency) {
        let co = typeof currency === 'object' && currency.internal && this.currencies[currency.internal] ? currency : undefined;
        return this.aliases[currency] ? this.currencies[this.aliases[currency]] : (this.currencies[currency] || co);
    }

    _gc(currency) {
        let cur = this._rc(currency);

        if (!cur || typeof cur !== 'object') {
            throw new TypeError("no such currency: " + currency + " | currencies: " + Object.keys(this.currencies) + " / aliases: " + Object.keys(this.aliases));
        }

        return cur;
    }

    _vv(value) {
        if (typeof value === 'object') {
            if (typeof value.low === 'number') return this.valueFromRange(value).value;
            else if (typeof value.value === 'number') return value.value;
            else return 0;
        }

        return value || 0;
    }

    static _floatdiv(a, b, acc=2, round=null) {
        let p = Math.pow(10, acc < 2 ? 2 : acc);
        let fn = round || ((n) => n);

        return fn(a * p / b) / p;
    }

    _brt(currency) {
        return currency._bc[EconCC.RangeTag[this.range]];
    }

    _sepnum(num) {
        return ("" + num).replace(/\B(?=(\d{3})+(?!\d))/g, this.separators.thousand).replace(/\./g, this.separators.decimal);
    }

    scope(state, fn) {
        let self = {currencies: this.currencies, aliases: this.aliases, range: this.range, step: this.step, trailing: this.trailing, separators: this.separators};

        this.modify(state);
        fn(this);
        return this.modify(self);
    }

    isCurrency(cur) {
        if (typeof cur === 'object') {
            if (cur.currency) cur = cur.currency;
            else if (!cur.internal) return false;
        }

        return !!this._rc(cur);
    }

    convertToBC(value, currency=value.currency) {
        let cur = this._gc(currency);
        let val = this._vv(value);

        return (!cur || cur.bc || cur.rwc) ? val : val * this._brt(cur);
    }

    convertFromBC(value, currency=value.currency) {
        let cur = this._gc(currency);
        let val = this._vv(value);

        return (!cur || cur.bc || cur.rwc) ? val : EconCC._floatdiv(val, this._brt(cur), cur.round);
    }

    convertToCurrency(value, oldc, newc) {
        if (arguments.length === 2) {
            newc = oldc;
            oldc = value.currency;
        }

        let oldcc = this._gc(oldc);

        newc = this._gc(newc);
        value = this._vv(value);

        let ret = {currency: newc.internal};
        if (oldcc.rwc) value = EconCC._floatdiv(value, this._brt(oldcc), oldcc.round);
        if (newc.bc) {
            ret.value = this.convertToBC(value, oldc);
        } else if (newc.rwc) {
            ret.value = this.convertToBC(value, oldc) * this._brt(newc);
        } else {
            ret.value = this.convertFromBC(this.convertToBC(value, oldc), newc);
        }

        return ret;
    }

    formatCurrencyRange(value) {
        if (value.high) {
            let name = false;
            let cur = this._gc(value.currency);

            // $1.00–2.00
            // 1.00–2.00 ref
            if (cur.pos.sym === "start") name = true;
            return this.formatCurrency(value.low, value.currency, name) + "–" + this.formatCurrency(value.high, value.currency, !name);
        }

        return this.formatCurrency(value.low, value.currency);
    }

    formatCurrency(value, currency=value.currency, name=true) {
        let cur = this._gc(currency);
        let str = "",
            val = +(this._vv(value).toFixed(cur.round));
        let trailing = (cur.rwc || this.trailing === EconCC.Auto) ? cur.trailing : this.trailing;

        if (this.step !== EconCC.Disabled &&
            cur.step && val >= cur.step) {
            val = (Math.floor(val) + EconCC._floatdiv(Math.round(val % 1 / cur.step), Math.floor(1 / cur.step), cur.round, Math.floor)).toFixed(cur.round);
            if (!trailing) val = +val;
        } else {
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
    }

    parse(str) {
        let parts = str.split(" ");
        let range = (parts[0] || "").split(/-|–/);
        let mode = (parts[1] || "").split(":");
        let currency = mode[0];
        let fmtmode = mode[1];

        if (!this.isCurrency(currency)) {
            for (let cname in this.currencies) {
                let cur = this.currencies[cname];
                let sym = cur.symbol;

                if (!sym) continue;
                let pos = cur.pos.sym;
                let start = (range[0] || "")[0];
                let end = range[1] ? range[1].slice(-1) : "";

                if ((pos === "start" && sym === start) || (pos === "end" && sym === end)) {
                    currency = cname;
                    break;
                }
            }
        }

        if (!fmtmode) {
            fmtmode = range[range.length - 1].split(":")[1];
        }

        return {
            currency,
            low: Number(range[0].replace(doubledash, "00").replace(nondec, "")),
            high: range[1] ? Number(range[1].replace(doubledash, "00").replace(nondec, "")) : undefined,
            mode: EconCC.Mode[fmtmode]
        };
    }

    f(str) {
        let value = this.parse(str);
        return this.format(value, value.mode);
    }

    format(value, mode=EconCC.Mode.Short) {
        let primary;

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

        let vc = this._gc(value.currency);
        let fmt = [];
        let donecur = {};
        let label = mode === EconCC.Mode.Label;
        let threshold = label ? 1 : 0.8;

        if (label) {
            fmt.push({str: primary, cvalue: this._brt(vc)});
        }

        donecur[vc.internal] = true;
        for (let cname in this.currencies) {
            let cur = this.currencies[cname];

            if (cur.internal === value.currency || donecur[cname] || (label && !cur.label) || (!label && cur.hidden)) {
                continue;
            }

            let val = this.convertToCurrency(value, value.currency, cur);
            if (!cur.rwc && val.value < threshold) {
                continue;
            }

            let obj = {str: this.formatCurrency(val), fmt: cur.pos.fmt};

            if (label) {
                obj.cvalue = this._brt(cur);
            }

            donecur[cname] = true;
            fmt.push(obj);
        }

        if (label) {
            fmt.sort(function (a, b) {
                let cv = b.cvalue - a.cvalue;
                if (cv === 0) {
                    return b.fmt - a.fmt;
                }
                return cv;
            });
            return fmt[0].str;
        }

        fmt.sort(function (a, b) { return a.fmt - b.fmt; });
        return primary + (fmt.length ? " (" + fmt.map((o) => o.str).join(", ") + ")" : "");
    }

    formatRange(value, mode=EconCC.Mode.Short) {
        let cur = value.currency;
        return this.format({currency: cur, value: value.low}, mode) + (value.high ? " – " + this.format({currency: cur, value: value.high}, mode) : "");
    }

    scm(val, mode=EconCC.SCM.Buyer, fees={}) {
        let {value, currency} = this.valueFromRange(val);
        let buyer = {currency};
        let seller = {currency};

        if (mode === EconCC.SCM.Buyer) {
            let fee = EconCC.stmCalculateFee(value * 100, fees);
            let svalue = Math.max(EconCC._floatdiv(fee.cents - fee.fees, 100), 0.01);

            buyer.value = value;
            seller.value = svalue;
        } else if (mode === EconCC.SCM.Seller) {
            seller.value = value;
            buyer.value = Math.max(EconCC._floatdiv(EconCC.stmCalculateInclFee(value * 100, fees).cents, 100), 0.03);
        }

        return {buyer, seller};
    }

    static stmCalculateFee(cents, {stmFee, publisherFee, baseFee, minFee}={}) {
        stmFee = typeof stmFee === 'number' ? stmFee : 0.05;
        publisherFee = typeof publisherFee === 'number' ? publisherFee : 0.1;
        baseFee = typeof baseFee === 'number' ? baseFee : 0;
        minFee = typeof minFee === 'number' ? minFee : 1;

        let wallet = {stmFee, publisherFee, baseFee, minFee};
        let receiver = Math.floor((cents - baseFee) / (stmFee + publisherFee + 1));
        let fees = EconCC.stmCalculateInclFee(receiver, wallet);
        let undershot = false;
        let iter = 0;

        // Math correction using Steam's algorithm
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
    }

    static stmCalculateInclFee(funds, {stmFee, publisherFee, baseFee, minFee}={}) {
        stmFee = typeof stmFee === 'number' ? stmFee : 0.05;
        publisherFee = typeof publisherFee === 'number' ? publisherFee : 0.1;
        baseFee = typeof baseFee === 'number' ? baseFee : 0;
        minFee = typeof minFee === 'number' ? minFee : 1;

        let steamFee = Math.floor(Math.floor(Math.max(funds * stmFee, minFee)) + baseFee);
        let pubFee = Math.floor(publisherFee > 0 ? Math.max(funds * publisherFee, 1) : 0);
        let fees = steamFee + pubFee;

        return {steamFee, publisherFee: pubFee, fees, cents: funds + fees};
    }

    // rwc, gc, bc
    static makeCurrency(type, {internal, trailing, low, high, round, hidden, label, symbol, pos, currency, names, step}) {
        if (typeof round === 'undefined') round = 2;
        let cur = {internal, trailing, low, high, round, hidden, label, pos};

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

            if (typeof cur.trailing === 'undefined') cur.trailing = true;
        }

        return cur;
    }
}

let Converters = {
    backpackTFItem(price) {
        return {currency: price.currency, low: price.value, high: price.value_high};
    },
    backpackTF(currencies) {
        if (currencies.response) currencies = currencies.response;
        if (currencies.currencies) currencies = currencies.currencies;

        let aliases = {};
        let pos = 0;
        let currs = {
            "usd": EconCC.makeCurrency("rwc", {
                internal: "usd",
                symbol: "$",
                pos: {sym: "start", fmt: 99}
            })
        };

        for (let cname in currencies) {
            let cobj = currencies[cname];
            let iprice = cobj.price;
            let hidden = cobj.blanket || cobj.hidden;

            if (cname === "earbuds") hidden = true;

            let curn = currs[cname] = {
                internal: cname,
                currency: iprice.currency,
                low: iprice.value,
                high: iprice.value_high,
                names: [cobj.single, cobj.plural],
                round: cobj.round,
                pos: {fmt: pos},
                hidden: !!hidden,
                label: !hidden,
                trailing: false
            };

            aliases[cobj.single] = aliases[cobj.plural] = cname;
            if (cname === "metal") {
                curn.bc = true; // base currency
                curn.step = 0.055;
                curn.trailing = true;

                currs.usd.low = iprice.value;
                currs.usd.high = iprice.value_high;
            } else if (cname === "earbuds" || cname === "keys") {
                curn.step = 0.05;
            }

            pos += 1;
        }

        return {currencies: currs, range: EconCC.Range.Mid, aliases, convert: false};
    },
    // IGetMarketPrices
    backpackSCM(items, spec, rwc, notax=false) {
        if (items.response) items = items.response;
        if (items.items) items = items.items;

        let aliases = {};
        let pos = 0;
        let currs = {};

        if (!rwc) {
            rwc = EconCC.makeCurrency("rwc", {
                internal: "usd",
                symbol: "$",
                pos: {sym: "start", fmt: 99}
            });
        }

        currs[rwc.internal] = rwc;

        let fees = typeof notax === 'object' ? notax : {};

        for (let iname in spec) {
            let item = spec[iname];
            let {internal: iinternal, names: inames, round: iround, trailing: itrailing, hidden: ihidden, label: ilabel, pos: ipos, bc: ibc, rwc: irwc} = item;

            if (typeof inames === "string") inames = [inames, inames];
            if (!ipos) ipos = {fmt: pos};

            let cents = items[iname].value;
            if (notax) {
                cents -= EconCC.stmCalculateFee(cents, fees).fees;
            }

            let price = cents / 100;

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

        for (let icur in currs) {
            let cur = currs[icur];

            if (cur.bc || cur.rwc) continue;
            cur.low = cur.low / rwc.low;
        }

        return {currencies: currs, range: EconCC.Range.Mid, aliases, convert: false};
    }
};

EconCC.converters = Converters;

EconCC.Range = {Low: 0, Mid: 1, High: 2};
EconCC.Mode = {Short: 1, Long: 2, ShortRange: 3, LongRange: 4, Label: 5};
EconCC.SCM = {Buyer: 1, Seller: 2};
EconCC.RangeTag = ["low", "mid", "high"];
EconCC.Auto = 2;
EconCC.Enabled = 1;
EconCC.Disabled = 0;

export default EconCC;
