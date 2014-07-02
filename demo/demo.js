'use strict';

var fs = require('fs'),
    path = require('path');

/* allen */
function type(a) {
    if(typeof a === 'string')
        return 'str('+a+')';
    else if(typeof a === 'number') 
        return a+1;
    else if(typeof a === 'boolean')
        return !a;
    else if(typeof a === 'function')
        return a;
    else if(typeof a === 'object') {
        if(a instanceof Array)
            return a.push(0);
        else if(a instanceof Object) {
            a.t = 't';
            return a;
        }
        else
            return a;
    }
    else if(typeof a === 'undefined')
        return a;
    else
        throw 'error';
};


/* allen */
function params(a, b) {
    return {'a':type(a), 'b': type(b)};
};


/* allen callback:cb */
function callback(a, cb) {
    var result = type(a);
    var msg = "success";

    cb(msg, result);
};


var cxtIn;
var cxtOut;
/* allen */
function context() {
    cxtOut = type(cxtIn);
}


/* allen */
function contextImplicit() {
    context();
}


/* allen */
function stub() {

    var str = fs.readFileSync(__dirname +'/data.json');

    return str;
}

/* allen */
function stubTwice() {

    var p = path.join('dir/', 'subdir/'),
        result;

    result = path.join(p, 'flename');

    return result;
}


/* allen */
function stubAsync(cb) {
    fs.readFile(__dirname+'/data.json', function(err, data) {
        cb(JSON.parse(data));
    });
}

/* allen */
function closure(a) {
    var f = function() {
        return type(a);
    };

    cxtOut = f();

}


module.exports = {
    type: type,
    params: params,
    callback: callback,

    ctxIn: cxtIn,
    cxtOut: cxtOut,
    context: context,
    contextImplicit: contextImplicit,

    stub: stub,
    stubTwice: stubTwice,
    stubAsync: stubAsync
};