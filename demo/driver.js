'use strict';
var demo = require('./demo.js');


demo.type(1);
demo.type('1');
demo.type(true);
demo.type(function() { console.log('demo.type')});
demo.type([1]);
demo.type({'o': 'o'});
demo.type();
demo.type(1, '2');

demo.params(1, 2);

demo.callback({data: 'data'}, function(msg, result) { });


demo.ctxIn = 'a';
demo.ctxOut = '';
demo.context();

demo.contextImplicit();

demo.stub();

demo.stubTwice();

demo.stubAsync(function(obj) { });