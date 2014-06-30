'use strict';
var demo = require('./demo.js');

demo.simpleInOut(1, null);
demo.funexp(null, '1');

demo.funAsync(1, function cb(data) {
    console.log(data.data);
});
