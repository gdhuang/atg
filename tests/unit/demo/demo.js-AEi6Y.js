'use strict';
var expect = require('chai').expect,
    sut = require('../../../demo/demo.js');
describe('demo.js', function() {
    before(function() {});
    after(function() {});
    it('funexp', function() {
        var a = null;
        var b = "1";
        var result = sut.funexp(a, b);
        expect(result).equals("11");
    });
})