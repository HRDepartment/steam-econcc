class EconCC {
    constructor(currencies, pricelist) {
        this.currencies = {};
        this.aliases = {};
        this.step = EconCC.Disabled;
        this.trailing = EconCC.Auto;
        this.range = EconCC.Range.Low;
        this.separators = {thousand: ",", decimal: "."};

        if (typeof currencies === 'object') {
            if (typeof pricelist === 'object') {
                // fromBackpack shorthand
                this.modify(EconCC.cFromBackpack(currencies, pricelist));
            } else {
                // initialize with object
                this.modify(currencies);
            }
        }
    }

    modify(state={}) {
        for (let name in state) {
            let val = state[name],
                self = this[name];

            if (val !== undefined && typeof self !== 'undefined' && typeof self !== 'function') {
                this[name] = val;
            }

            if (name === 'currencies') this.update();
        }

        return this;
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
                    mid *= (next.high ? this._floatdiv(next.low + next.high, 2, next.round) : next.low);
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
            res.value = value.high ? this._floatdiv(value.low + value.high, 2, this._gc(currency).round) : value.low;
            break;
        case EconCC.Range.High:
            res.value = value.high || value.low;
            break;
        }

        return res;
    }

    _gc(currency) {
        let cur = this.aliases[currency] ? this.currencies[this.aliases[currency]] : (this.currencies[currency] || currency);

        if (!cur || typeof cur !== 'object') {
            throw new Error("no such currency: " + currency + " | currencies: " + Object.keys(this.currencies) + " / aliases: " + Object.keys(this.aliases));
        }

        return cur;
    }

    _floatdiv(a, b, acc=2, round=((n) => n)) {
        let p = Math.pow(10, acc < 2 ? 2 : acc);
        return round(a * p / b) / p;
    }

    _rt() {
        return EconCC.RangeTag[this.range];
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

    convertToBC(value, currency=value.currency) {
        currency = this._gc(currency);
        value = typeof value === 'object' ? value.value : value;

        return (!currency || currency.bc || currency.rwc) ? value : value * currency._bc[this._rt()];
    }

    convertFromBC(value, currency=value.currency) {
        currency = this._gc(currency);
        value = typeof value === 'object' ? value.value : value;

        return (!currency || currency.bc || currency.rwc) ? value : this._floatdiv(value, currency._bc[this._rt()], currency.round);
    }

    convertToCurrency(value, oldc, newc) {
        if (arguments.length === 2) {
            newc = oldc;
            oldc = value.currency;
        }

        let oldcc = this._gc(oldc);

        newc = this._gc(newc);
        value = typeof value === 'object' ? value.value : (value || 0);

        let ret = {currency: newc.internal};
        if (oldcc.rwc) value = this._floatdiv(value, oldcc._bc[this._rt()], oldcc.round);
        if (newc.bc) {
            ret.value = this.convertToBC(value, oldc);
        } else if (newc.rwc) {
            ret.value = this.convertToBC(value, oldc) * newc._bc[this._rt()];
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
            val = +((typeof value === 'number' ? value : value.value).toFixed(cur.round));
        let trailing = (cur.rwc || this.trailing === EconCC.Auto) ? cur.trailing : this.trailing;

        if (this.step !== EconCC.Disabled &&
            cur.step && val >= cur.step) {
            val = (Math.floor(val) + this._floatdiv(Math.round(val % 1 / cur.step), Math.floor(1 / cur.step), cur.round, Math.floor)).toFixed(cur.round);
            if (!trailing) val = +val;
        } else {
            if (trailing) {
                val = val.toFixed(cur.round); // Add back any trailing zeros
            }
        }

        val = this._sepnum(val);
        if (!name) return val;
        if (cur.rwc) {
            switch(cur.pos.sym) {
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
        let range = parts[0].split("-");
        let mode = parts[1].split(":");

        return {currency: mode[0], low: +(range[0].replace(/,/g, "")), high: range[1] ? +(range[1].replace(/,/g, "")) : undefined, mode: EconCC.Mode[mode[1]]};
    }

    // Helper for consumers
    f(str) {
        let value = this.parse(str);
        return this.format(value, value.mode);
    }

    format(value, mode=EconCC.Mode.Short) {
        let primary;

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

        let vc = this._gc(value.currency),
            fmt = [],
            donecur = {},
            label = mode === EconCC.Mode.Label,
            threshold = label ? 1 : 0.8;

        if (label) {
            fmt.push({str: primary, cvalue: vc._bc[this._rt()]});
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
                obj.cvalue = cur._bc[this._rt()];
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
        return this.format({currency: cur, value: value.low}) + (value.high ? " – " + this.format({currency: cur, value: value.high}) : "");
    }

    scm(val) {
        let {value, currency} = this.valueFromRange(val);
        let svalue = Math.max(value - Math.max(value * 0.05, 0.01) - Math.max(value * 0.1, 0.01), 0.01);

        return {
            buyer: {currency, value},
            seller: {currency, value: svalue}
        };
    }

    static _makeRWC({name, symbol, pos, round, low, high}) {
        return {
            internal: name,
            rwc: true,
            trailing: true,
            // How much 1 BC is worth in this currency
            low: low || 0,
            high: high || 0,
            symbol,
            pos,
            round
        };
    }

    static iFromBackpack(price) {
        return {currency: price.currency, low: price.value, high: price.value_high};
    }

    static cFromBackpack(currencies, pricelist) {
        let c = currencies;

        if (c.response) c = c.response;

        switch (c.name) {
            //case "Team Fortress 2":
            default:
                return EconCC.cFromBackpackTF(currencies, pricelist);
        }
    }

    static cFromBackpackTF(currencies, pricelist) {
        if (currencies.response) currencies = currencies.response;
        if (currencies.currencies) currencies = currencies.currencies;

        if (pricelist.response) pricelist = pricelist.response;
        if (pricelist.items) pricelist = pricelist.items;

        let plistkeys = Object.keys(pricelist);
        let currs = {
            "usd": EconCC._makeRWC({
                name: "usd",
                symbol: "$",
                pos: {sym: "start", fmt: 99},
                round: 2
            })
        };
        let aliases = {};

        let pos = 0;
        for (let cname in currencies) {
            let cobj = currencies[cname];
            let plist;

            for (let i = 0, len = plistkeys.length; i < len; i += 1) {
                let item = pricelist[plistkeys[i]];
                if (item.defindex[0] === cobj.defindex) {
                    plist = item;
                    break;
                }
            }

            if (!plist) throw new Error("Unknown defindex " + cobj.defindex + " not in pricelist");

            let iprice = plist.prices[cobj.quality][cobj.tradable][cobj.craftable][0];
            let hidden = cobj.blanket || cobj.hidden;
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

        return {currencies: currs, range: EconCC.Range.Mid, aliases};
    }
}

EconCC.Range = {Low: 0, Mid: 1, High: 2};
EconCC.Mode = {Short: 1, Long: 2, ShortRange: 3, LongRange: 4, Label: 5};
EconCC.RangeTag = ["low", "mid", "high"];
EconCC.Auto = 2;
EconCC.Enabled = 1;
EconCC.Disabled = 0;

export default EconCC;
