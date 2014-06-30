'use strict';
var expect = require('chai').expect,
    sut = require('../../../demo/demo.js');
describe('demo.js', function() {
    before(function() {});
    after(function() {});
    it('simpleInOut', function() {
        var a = 1;
        var b = null;
        var result = sut.simpleInOut(a, b);
        expect(result).equals(2);
    });
})