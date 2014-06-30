'use strict';
var expect = require('chai').expect,
    sut = require('../../../demo/demo.js');
describe('demo.js', function() {
    before(function() {});
    after(function() {});
    it('funAsync', function() {
        var a = 1;
        var cb;
        var cb = function() {
            expect(arguments[0]).equals({
                "data": 2
            });
        };
        var result = sut.funAsync(a, cb);
    });
})