describe("EconCC - CSGO SCM", function () {
    var EconCC = require('../index.js');
    var scm = require('./scm-csgo.json');
    var items = {
        "CS:GO Capsule Key": {
            internal: "capsulekeys",
            names: ["capsule key", "capsule keys"]
        },
        "CS:GO Case Key": {
            internal: "casekeys",
            names: ["case key", "case keys"],
            bc: true
        }
    };
    var type = "backpackSCM";

    var ec, f;
    var ecparams = EconCC.converters[type](scm, items);
    beforeEach(function () {
        ec = new EconCC(ecparams);
        f = ec.f.bind(ec);
        //f = function (str) { var a; return a = ec.f(str), console.log(a), a; };
    });

    describe("#constructor", function () {
        var e = new EconCC(scm, type, items);
        it("does the same as .modify with correct args", function () {
            expect(e).toEqual(ec);
        });
    });

    describe("#format", function () {
        it("formats capsule keys", function () {
            expect(f('1 capsulekeys')).toBe('1 capsule key');
            expect(f('1 capsulekeys:Long')).toBe('1 capsule key ($1.11)');
            expect(f('5 capsulekeys:Long')).toBe('5 capsule keys (2.1 case keys, $5.55)');
            expect(f('4-5 capsulekeys')).toBe('4.5 capsule keys');
            expect(f('4-5 capsulekeys:Long')).toBe('4.5 capsule keys (1.89 case keys, $5.00)');
            expect(f('4-5 capsulekeys:ShortRange')).toBe('4–5 capsule keys');
            expect(f('4-5 capsulekeys:LongRange')).toBe('4–5 capsule keys (1.89 case keys, $5.00)');

            expect(f('100 capsulekeys:Long')).toBe('100 capsule keys (42.05 case keys, $111.00)');
        });

        it("formats low-end capsule keys", function () {
            ec.range = EconCC.Range.Low;
            expect(f('4-5 capsulekeys:Long')).toBe('4 capsule keys (1.68 case keys, $4.44)');
        });

        it("formats high-end capsule keys", function () {
            ec.range = EconCC.Range.High;
            expect(f('4-5 capsulekeys:Long')).toBe('5 capsule keys (2.1 case keys, $5.55)');
        });

        it("formats case keys", function () {
            expect(f('1 casekeys')).toBe('1 case key');
            expect(f('1 casekeys:Long')).toBe('1 case key (2.38 capsule keys, $2.64)');
            expect(f('0.5 casekeys:Long')).toBe('0.5 case keys (1.19 capsule keys, $1.32)');
            expect(f('1-2 casekeys')).toBe('1.5 case keys');
            expect(f('1-2 casekeys:Long')).toBe('1.5 case keys (3.57 capsule keys, $3.96)');
            expect(f('1-2 casekeys:ShortRange')).toBe('1–2 case keys');
            expect(f('1-2 casekeys:LongRange')).toBe('1–2 case keys (3.57 capsule keys, $3.96)');

            expect(f('100 casekeys:Long')).toBe('100 case keys (237.84 capsule keys, $264.00)');
        });
    });
});
