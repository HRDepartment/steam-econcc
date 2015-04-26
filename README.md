## EconCC

EconCC is a currency conversion and formatting library for Steam economy and real world currencies, based on the format used by backpack.tf.

You can feed backpack.tf's IGetCurrencies and IGetPrices APIs into it, or specify your own currencies. Currency-specific rounding is supported, and you can include as many real world currencies as you'd like.

EconCC has no dependencies and is supported on node.js/io.js and the browser (ES5 or better). backpack.tf parsing is supported for IGetCurrencies v1 and IGetPrices v4. You must obtain the data yourself and JSON.parse it before feeding it into EconCC.

npm: `npm install --save steam-econcc`

### Examples

See [EconCCSpec.js](spec/EconCCSpec.js) for some example usage.

### Documentation

See [Documentatin.md](Documentation.md).

### Testing

Tests are written using jasmine. Install the test runner globally (`npm install -g jasmine`) and run `npm test` in the root directory.

### License

[MIT](License)
