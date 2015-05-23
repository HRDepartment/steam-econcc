describe("EconCC", function () {
    var EconCC = require('../index.js');
    var currencies = require('./currencies.json');

    var ec, f;
    var emparams = EconCC.cFromBackpack(currencies);
    beforeEach(function () {
        ec = new EconCC(emparams);
        f = ec.f.bind(ec);
        //f = function (str) { var a; return a = ec.f(str), console.log(a), a; };
    });

    describe("#format", function () {
        it("formats usd", function () {
            expect(f('1 usd')).toBe('$1.00');
            expect(f('1 usd:Long')).toBe('$1.00 (8.70 ref)');
            expect(f('1-2 usd')).toBe('$1.50');
            expect(f('1-2 usd:Long')).toBe('$1.50 (13.04 ref)');
            expect(f('1-2 usd:ShortRange')).toBe('$1.00–2.00');
            expect(f('1-2 usd:LongRange')).toBe('$1.00–2.00 (13.04 ref)');

            expect(f('100 usd:Long')).toBe('$100.00 (869.57 ref, 51.15 keys, 9.52 buds)');
        });

        it("formats metal", function () {
            expect(f('0.01 metal')).toBe('0.01 ref');

            expect(f('1 metal')).toBe('1.00 ref');
            expect(f('1 metal:Long')).toBe('1.00 ref ($0.11)');
            expect(f('1-2 metal')).toBe('1.50 ref');
            expect(f('1-2 metal:Long')).toBe('1.50 ref ($0.17)');
            expect(f('1-2 metal:ShortRange')).toBe('1.00–2.00 ref');
            expect(f('1-2 metal:LongRange')).toBe('1.00–2.00 ref ($0.17)');

            expect(f('100 metal:Long')).toBe('100.00 ref (5.88 keys, 1.09 buds, $11.50)');
        });

        it("formats hat", function () {
            expect(f('1 hat')).toBe('1 hat');
            expect(f('1 hat:Long')).toBe('1 hat (1.33 ref, $0.15)');
            expect(f('1-2 hat')).toBe('1.5 hats');
            expect(f('1-2 hat:Long')).toBe('1.5 hats (2.00 ref, $0.23)');
            expect(f('1-2 hat:ShortRange')).toBe('1–2 hats');
            expect(f('1-2 hat:LongRange')).toBe('1–2 hats (2.00 ref, $0.23)');

            expect(f('100 hat:Long')).toBe('100 hats (133.00 ref, 7.82 keys, 1.46 buds, $15.29)');
        });

        it("formats keys", function () {
            expect(f('1 keys')).toBe('1 key');
            expect(f('1 keys:Long')).toBe('1 key (17.00 ref, $1.95)');
            expect(f('1-2 keys')).toBe('1.5 keys');
            expect(f('1-2 keys:Long')).toBe('1.5 keys (25.50 ref, $2.93)');
            expect(f('1-2 keys:ShortRange')).toBe('1–2 keys');
            expect(f('1-2 keys:LongRange')).toBe('1–2 keys (25.50 ref, $2.93)');

            expect(f('100 keys:Long')).toBe('100 keys (1,700.00 ref, 18.6 buds, $195.50)');
        });

        it("formats earbuds", function () {
            expect(f('1 earbuds')).toBe('1 bud');
            expect(f('1 earbuds:Long')).toBe('1 bud (91.38 ref, 5.38 keys, $10.51)');
            expect(f('1-2 earbuds')).toBe('1.5 buds');
            expect(f('1-2 earbuds:Long')).toBe('1.5 buds (137.06 ref, 8.06 keys, $15.76)');
            expect(f('1-2 earbuds:ShortRange')).toBe('1–2 buds');
            expect(f('1-2 earbuds:LongRange')).toBe('1–2 buds (137.06 ref, 8.06 keys, $15.76)');

            expect(f('100 earbuds:Long')).toBe('100 buds (9,137.50 ref, 537.5 keys, $1,050.81)');
        });

        it("uses the thousand separator", function () {
            ec.separators.thousand = "!";

            expect(f('100 earbuds:Long')).toBe('100 buds (9!137.50 ref, 537.5 keys, $1!050.81)');
        });

        it("uses the decimal separator", function () {
            ec.separators.decimal = "!";

            expect(f('100 earbuds:Long')).toBe('100 buds (9,137!50 ref, 537!5 keys, $1,050!81)');
        });

        it("accepts EconCCValues", function () {
            expect(ec.format({value: 1, currency: 'metal'})).toBe('1.00 ref');
        });

        it("uses step", function () {
            ec.step = EconCC.Enabled;

            expect(f('0.01 metal')).toBe('0.01 ref');
            expect(f('0.06 metal')).toBe('0.05 ref');
            expect(f('0.11 metal')).toBe('0.11 ref');
            expect(f('0.57 metal')).toBe('0.55 ref');
            expect(f('0.48 metal')).toBe('0.50 ref');
            expect(f('0.98 metal')).toBe('1.00 ref');
            expect(f('0.99 metal')).toBe('1.00 ref');
            expect(f('8139.99 metal')).toBe('8,140.00 ref');
            expect(ec.format({low: 0.11, high: 0.12, currency: 'usd'})).toBe('$0.12');

            expect(f('100 hat:Long')).toBe('100 hats (133.00 ref, 7.8 keys, 1.45 buds, $15.29)');
        });

        describe("Mode = Label", function () {
            it("selects the most expensive currency", function () {
                expect(f('15 usd:Label')).toBe('1.43 buds');
                expect(f('15 metal:Label')).toBe('15.00 ref');
                expect(f('18 metal:Label')).toBe('1.06 keys');
                expect(f('100 metal:Label')).toBe('1.09 buds');
            });

            it("ignores currencies when cur.label = false", function () {
                ec.currencies.earbuds.label = false;

                expect(f('1 usd:Label')).toBe('$1.00');
                expect(f('10 metal:Label')).toBe('10.00 ref');
                expect(f('100 usd:Label')).toBe('51.15 keys');
                expect(f('100 metal:Label')).toBe('5.88 keys');
            });
        });

        it("does not repeat currencies", function () {
            expect(f('1.4 key:Long')).toBe('1.4 keys (23.80 ref, $2.74)');
        });
    });

    describe("#convertToCurrency", function () {
        it("converts hats to metal", function () {
            expect(ec.convertToCurrency(1, 'hat', 'metal')).toEqual({value: 1.33, currency: 'metal'});
        });
        it("converts earbuds to hats", function () {
            expect(ec.convertToCurrency(1.52, 'earbuds', 'hat')).toEqual({value: 104.42857142857143, currency: 'hat'});
        });
    });

    describe("#formatCurrency", function () {
        it("formats keys", function () {
            expect(ec.formatCurrency({value: 13.2, currency: 'keys'})).toBe('13.2 keys');
        });

        describe("(trailing)", function () {
            it("formats keys", function () {
                ec.trailing = EconCC.Enabled;
                expect(ec.formatCurrency({value: 13.2, currency: 'keys'})).toBe('13.20 keys');
            });
        });
    });

    describe("#parse", function () {
        it("parses value", function () {
            expect(ec.parse("1 ref")).toEqual({low: 1, currency: 'ref', high: undefined, mode: undefined});
        });
        it("parses range", function () {
            expect(ec.parse("1-2 ref")).toEqual({low: 1, high: 2, currency: 'ref', mode: undefined});
        });
        it("parses mode", function () {
            expect(ec.parse("1 ref:Long")).toEqual({low: 1, currency: 'ref', mode: EconCC.Mode.Long, high: undefined});
        });
        it("parses range+mode", function () {
            expect(ec.parse("1-2 ref:Long")).toEqual({low: 1, high: 2, currency: 'ref', mode: EconCC.Mode.Long});
        });
        it("parses symbols", function () {
            expect(ec.parse("$1")).toEqual({low: 1, currency: 'usd', high: undefined, mode: undefined});
            expect(ec.parse("$1-2")).toEqual({low: 1, currency: 'usd', high: 2, mode: undefined});
            expect(ec.parse("$1:Long")).toEqual({low: 1, currency: 'usd', high: undefined, mode: EconCC.Mode.Long});
            expect(ec.parse("$1-2:Long")).toEqual({low: 1, currency: 'usd', high: 2, mode: EconCC.Mode.Long});
        });
    });

    describe("#scm", function () {
        it("creates a copy of the value", function () {
            var v = {value: 0.01, currency: 'usd'};
            expect(ec.scm(v).buyer).not.toBe(v);
            expect(ec.scm(v).buyer).toEqual(v);
        });
        it("calculates the SCM seller price", function () {
            expect(ec.scm({low: 0.03, currency: 'usd'}).seller).toEqual({value: 0.01, currency: 'usd'});
        });
    });

    describe("#_rc", function () {
        it("accepts currency objects", function () {
            expect(ec._rc(ec.currencies.metal)).toBe(ec.currencies.metal);
        });
        it("accepts internal names", function () {
            expect(ec._rc("metal")).toBe(ec.currencies.metal);
        });
        it("converts aliases", function () {
            expect(ec._rc("buds")).toBe(ec.currencies.earbuds);
        });
    });

    describe("#isCurrency", function () {
        it("handles {currency.internal}", function () {
            expect(ec.isCurrency("metal")).toBe(true);
            expect(ec.isCurrency("nope")).toBe(false);
        });
        it("handles currency objects", function () {
            expect(ec.isCurrency(ec.currencies.metal)).toBe(true);
            expect(ec.isCurrency({})).toBe(false);
        });
        it("handles aliases", function () {
            expect(ec.isCurrency("ref")).toBe(true);
        });
        it("handles values with .currency", function () {
            expect(ec.isCurrency({currency: 'metal'})).toBe(true);
            expect(ec.isCurrency({currency: 'ref'})).toBe(true);
            expect(ec.isCurrency({currency: 'notref'})).toBe(false);
        });
    });

    describe("#scope", function () {
        it("resets the state after calling fn", function () {
            expect(ec.trailing).toBe(EconCC.Auto);

            ec.trailing = EconCC.Disabled;

            ec.scope({trailing: EconCC.Enabled}, function (self) {
                expect(self).toBe(ec);
                expect(ec.trailing).toBe(EconCC.Enabled);
            });

            expect(ec.trailing).toBe(EconCC.Disabled);
        });
        it("can be stacked", function () {
            expect(ec.trailing).toBe(EconCC.Auto);
            expect(ec.step).toBe(EconCC.Disabled);

            ec.scope({trailing: EconCC.Disabled, step: EconCC.Enabled}, function () {
                expect(ec.trailing).toBe(EconCC.Disabled);
                expect(ec.step).toBe(EconCC.Enabled);
                ec.scope({trailing: EconCC.Enabled}, function () {
                    expect(ec.trailing).toBe(EconCC.Enabled);
                    expect(ec.step).toBe(EconCC.Enabled);
                });
                expect(ec.step).toBe(EconCC.Enabled);
                expect(ec.trailing).toBe(EconCC.Disabled);
            });

            expect(ec.step).toBe(EconCC.Disabled);
            expect(ec.trailing).toBe(EconCC.Auto);
        });
        it("does a partial object patch", function () {
            expect(ec.currencies.metal.hidden).toBe(false);
            ec.scope({currencies: {metal: {hidden: true}}}, function () {
                expect(ec.currencies.metal.hidden).toBe(true);
            });
            expect(ec.currencies.metal.hidden).toBe(false);
        });
    });
});
