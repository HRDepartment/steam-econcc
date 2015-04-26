describe("EconCC", function () {
    var EconCC = require('../index.js');
    var currencies = {
        "response": {
            "currencies": {
                "metal": {
                    "quality": 6,
                    "single": "ref",
                    "plural": "ref",
                    "round": 2,
                    "blanket": 0,
                    "craftable": "Craftable",
                    "tradable": "Tradable",
                    "defindex": 5002
                },
                "hat": {
                    "quality": 6,
                    "single": "hat",
                    "plural": "hats",
                    "round": 1,
                    "blanket": 1,
                    "blanket_name": "Random Craft Hat",
                    "craftable": "Craftable",
                    "tradable": "Tradable",
                    "defindex": -2
                },
                "keys": {
                    "quality": 6,
                    "single": "key",
                    "plural": "keys",
                    "round": 2,
                    "blanket": 0,
                    "craftable": "Craftable",
                    "tradable": "Tradable",
                    "defindex": 5021
                },
                "earbuds": {
                    "quality": 6,
                    "single": "bud",
                    "plural": "buds",
                    "round": 2,
                    "blanket": 0,
                    "craftable": "Craftable",
                    "tradable": "Tradable",
                    "defindex": 143
                }
            }
        }
    };
    var pricelist = {
        "response": {
            "items": {
                "Mann Co. Supply Crate Key": {
                    "defindex": [5021],
                    "prices": {
                        "6": {
                            "Tradable": {
                                "Craftable": [{
                                    "currency": "metal",
                                    "value": 17
                                }]
                            }
                        }
                    }
                },
                "Refined Metal": {
                    "defindex": [5002],
                    "prices": {
                        "6": {
                            "Tradable": {
                                "Craftable": [{
                                    "currency": "usd",
                                    "value": 0.11,
                                    "value_high": 0.12
                                }]
                            }
                        }
                    }
                },
                "Random Craft Hat": {
                    "defindex": [-2],
                    "prices": {
                        "6": {
                            "Tradable": {
                                "Craftable": [{
                                    "currency": "metal",
                                    "value": 1.33
                                }]
                            }
                        }
                    }
                },
                "Earbuds": {
                    "defindex": [143],
                    "prices": {
                        "6": {
                            "Tradable": {
                                "Craftable": [{
                                    "currency": "keys",
                                    "value": 5.25,
                                    "value_high": 5.5
                                }]
                            }
                        }
                    }
                }
            }
        }
    };

    var em, f;
    var emparams = EconCC.cFromBackpack(currencies, pricelist);

    beforeEach(function () {
        em = new EconCC(emparams);
        f = em.f.bind(em);
        //f = function (str) { var a; return a = em.f(str), console.log(a), a; };
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
            em.separators.thousand = "!";

            expect(f('100 earbuds:Long')).toBe('100 buds (9!137.50 ref, 537.5 keys, $1!050.81)');
        });

        it("should use the decimal separator", function () {
            em.separators.decimal = "!";

            expect(f('100 earbuds:Long')).toBe('100 buds (9,137!50 ref, 537!5 keys, $1,050!81)');
        });

        it("should step", function () {
            em.step = EconCC.Enabled;

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
            expect(em.convertToCurrency(1, 'hat', 'metal')).toEqual({value: 1.33, currency: 'metal'});
        });
        it("should convert earbuds to hats", function () {
            expect(em.convertToCurrency(1.52, 'earbuds', 'hat')).toEqual({value: 104.42857142857143, currency: 'hat'});
        });
    });

    describe("#formatCurrency", function () {
        it("should format keys", function () {
            expect(em.formatCurrency({value: 13.2, currency: 'keys'})).toBe('13.2 keys');
        });

        describe("(trailing)", function () {
            it("should format keys", function () {
                em.trailing = EconCC.Enabled;
                expect(em.formatCurrency({value: 13.2, currency: 'keys'})).toBe('13.20 keys');
            });
        });
    });

    describe("#_gc", function () {
        it("should accept currency objects", function () {
            expect(em._gc(em.currencies.metal)).toBe(em.currencies.metal);
        });
        it("should accept internal names", function () {
            expect(em._gc("metal")).toBe(em.currencies.metal);
        });
        it("should convert aliases", function () {
            expect(em._gc("buds")).toBe(em.currencies.earbuds);
        });
    });
});
