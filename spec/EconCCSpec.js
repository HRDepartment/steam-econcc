describe("EconCC", function () {
    var EconCC = require('../index.js');

    var ec;
    beforeEach(function () {
        ec = new EconCC();
    });

    describe("static stmCalculateFee", function () {
        it("calculates fees", function () {
            expect(EconCC.stmCalculateFee(3)).toEqual({steamFee: 1, publisherFee: 1, fees: 2, cents: 3});
            expect(EconCC.stmCalculateFee(249)).toEqual({steamFee: 10, publisherFee: 21, fees: 31, cents: 249});
            expect(EconCC.stmCalculateFee(250)).toEqual({steamFee: 10, publisherFee: 21, fees: 31, cents: 250});
        });
    });

    describe("static stmCalculateInclFee", function () {
        it("calculates feeless value", function () {
            expect(EconCC.stmCalculateInclFee(1)).toEqual({steamFee: 1, publisherFee: 1, fees: 2, cents: 3});
            expect(EconCC.stmCalculateInclFee(218)).toEqual({steamFee: 10, publisherFee: 21, fees: 31, cents: 249});
            expect(EconCC.stmCalculateInclFee(219)).toEqual({steamFee: 10, publisherFee: 21, fees: 31, cents: 250});
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
    });
});
