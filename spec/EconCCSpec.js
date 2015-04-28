describe("EconCC", function () {
    var EconCC = require('../index.js');
    var currencies = require('./currencies.json');
    var pricelist = require('./pricelist.json');

    var ec, f;
    var emparams = EconCC.cFromBackpack(currencies, pricelist);

    beforeEach(function () {
        ec = new EconCC(emparams);
        f = ec.f.bind(ec);
        //f = function (str) { var a; return a = ec.f(str), console.log(a), a; };
    });

    describe("#format", function () {
        it("should format usd", function () {
            expect(f('1 usd')).toBe('$1.00');
            expect(f('1 usd:Long')).toBe('$1.00 (8.70 ref)');
            expect(f('1-2 usd')).toBe('$1.50');
            expect(f('1-2 usd:Long')).toBe('$1.50 (13.04 ref)');
            expect(f('1-2 usd:ShortRange')).toBe('$1.00–2.00');
            expect(f('1-2 usd:LongRange')).toBe('$1.00–2.00 (13.04 ref)');

            expect(f('100 usd:Long')).toBe('$100.00 (869.57 ref, 51.15 keys, 9.52 buds)');
        });

        it("should format metal", function () {
            expect(f('0.01 metal')).toBe('0.01 ref');

            expect(f('1 metal')).toBe('1.00 ref');
            expect(f('1 metal:Long')).toBe('1.00 ref ($0.11)');
            expect(f('1-2 metal')).toBe('1.50 ref');
            expect(f('1-2 metal:Long')).toBe('1.50 ref ($0.17)');
            expect(f('1-2 metal:ShortRange')).toBe('1.00–2.00 ref');
            expect(f('1-2 metal:LongRange')).toBe('1.00–2.00 ref ($0.17)');

            expect(f('100 metal:Long')).toBe('100.00 ref (5.88 keys, 1.09 buds, $11.50)');
        });

        it("should format hat", function () {
            expect(f('1 hat')).toBe('1 hat');
            expect(f('1 hat:Long')).toBe('1 hat (1.33 ref, $0.15)');
            expect(f('1-2 hat')).toBe('1.5 hats');
            expect(f('1-2 hat:Long')).toBe('1.5 hats (2.00 ref, $0.23)');
            expect(f('1-2 hat:ShortRange')).toBe('1–2 hats');
            expect(f('1-2 hat:LongRange')).toBe('1–2 hats (2.00 ref, $0.23)');

            expect(f('100 hat:Long')).toBe('100 hats (133.00 ref, 7.82 keys, 1.46 buds, $15.29)');
        });

        it("should format keys", function () {
            expect(f('1 keys')).toBe('1 key');
            expect(f('1 keys:Long')).toBe('1 key (17.00 ref, $1.95)');
            expect(f('1-2 keys')).toBe('1.5 keys');
            expect(f('1-2 keys:Long')).toBe('1.5 keys (25.50 ref, $2.93)');
            expect(f('1-2 keys:ShortRange')).toBe('1–2 keys');
            expect(f('1-2 keys:LongRange')).toBe('1–2 keys (25.50 ref, $2.93)');

            expect(f('100 keys:Long')).toBe('100 keys (1,700.00 ref, 18.6 buds, $195.50)');
        });

        it("should format earbuds", function () {
            expect(f('1 earbuds')).toBe('1 bud');
            expect(f('1 earbuds:Long')).toBe('1 bud (91.38 ref, 5.38 keys, $10.51)');
            expect(f('1-2 earbuds')).toBe('1.5 buds');
            expect(f('1-2 earbuds:Long')).toBe('1.5 buds (137.06 ref, 8.06 keys, $15.76)');
            expect(f('1-2 earbuds:ShortRange')).toBe('1–2 buds');
            expect(f('1-2 earbuds:LongRange')).toBe('1–2 buds (137.06 ref, 8.06 keys, $15.76)');

            expect(f('100 earbuds:Long')).toBe('100 buds (9,137.50 ref, 537.5 keys, $1,050.81)');
        });

        it("should use the thousand separator", function () {
            ec.separators.thousand = "!";

            expect(f('100 earbuds:Long')).toBe('100 buds (9!137.50 ref, 537.5 keys, $1!050.81)');
        });

        it("should use the decimal separator", function () {
            ec.separators.decimal = "!";

            expect(f('100 earbuds:Long')).toBe('100 buds (9,137!50 ref, 537!5 keys, $1,050!81)');
        });

        it("should accept EconCCValues", function () {
            expect(ec.format({value: 1, currency: 'metal'})).toBe('1.00 ref');
        });

        it("should step", function () {
            ec.step = EconCC.Enabled;

            expect(f('0.01 metal')).toBe('0.01 ref');
            expect(f('0.06 metal')).toBe('0.05 ref');

            expect(f('100 hat:Long')).toBe('100 hats (133.00 ref, 7.8 keys, 1.45 buds, $15.29)');
        });

        it("should select most expensive currency when mode is Label", function () {
            expect(f('15 metal:Label')).toBe('15.00 ref');
            expect(f('18 metal:Label')).toBe('1.06 keys');
            expect(f('100 metal:Label')).toBe('1.09 buds');
        });
    });

    describe("#convertToCurrency", function () {
        it("should convert hats to metal", function () {
            expect(ec.convertToCurrency(1, 'hat', 'metal')).toEqual({value: 1.33, currency: 'metal'});
        });
        it("should convert earbuds to hats", function () {
            expect(ec.convertToCurrency(1.52, 'earbuds', 'hat')).toEqual({value: 104.42857142857143, currency: 'hat'});
        });
    });

    describe("#formatCurrency", function () {
        it("should format keys", function () {
            expect(ec.formatCurrency({value: 13.2, currency: 'keys'})).toBe('13.2 keys');
        });

        describe("(trailing)", function () {
            it("should format keys", function () {
                ec.trailing = EconCC.Enabled;
                expect(ec.formatCurrency({value: 13.2, currency: 'keys'})).toBe('13.20 keys');
            });
        });
    });

    describe("#_gc", function () {
        it("should accept currency objects", function () {
            expect(ec._gc(ec.currencies.metal)).toBe(ec.currencies.metal);
        });
        it("should accept internal names", function () {
            expect(ec._gc("metal")).toBe(ec.currencies.metal);
        });
        it("should convert aliases", function () {
            expect(ec._gc("buds")).toBe(ec.currencies.earbuds);
        });
    });
});
