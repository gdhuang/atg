'use strict';
var demo = require('./demo.js');

demo.simpleInOut(1, null);
demo.funexp(null, '1');

demo.funAsync(1, function cb(msg, data) {
    console.log(msg);
    console.log(data.data);
});
