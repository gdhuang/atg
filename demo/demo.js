'use strict';

/* allen */
function simpleInOut(a ,b) {
        var res = a + 1;
        return res;
};

/* allen */
var funexp = function(a, b) {
    var res = b + '1';
    return res;
};

/* allen callback:cb */
function funAsync(a, cb) {
    var result = {data: a+1};

    cb(result);
};


module.exports = {
    simpleInOut: simpleInOut,
    funexp: funexp,
    funAsync: funAsync
};