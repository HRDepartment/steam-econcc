var fs = require("fs");
var src = fs.readFileSync("econcc.js", "utf8");

var s = '        ';
var sp = s + '    ';

// Fixes default export
src = src
    .replace('global.EconCC = mod.exports', 'global.EconCC = mod.exports["default"]')
    .replace('factory(exports);', 'factory(exports);\n' + s + 'module.exports = exports["default"];')
    .replace('define("EconCC", ["exports"], factory);',
             'define("EconCC", ["exports", "module"], function (exports, module) {\n' + sp + 'factory(exports);\n' + sp + 'module.exports = exports["default"];\n' + s + '});');

fs.writeFileSync("econcc.js", src);
