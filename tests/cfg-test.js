'use strict';

var fs = require('fs'),
    esprima = require('esprima'),
    expect = require("chai").expect,
    ast = require('../lib/ast.js'),
    visitor = require('../lib/visitor.js'),
    cfg = require('../lib/cfg.js');

describe('cfg.js', function(){
    var tree;
    
    before(function () {

    });
    
    it('blocklize', function(){
        var expected = fs.readFileSync('./tests/mock/curl-expected.js', 'utf-8'),
            code;
        
        tree = ast.parse("./tests/mock/curl.js");
        code = ast.dump(cfg.blocklize(tree));
        
        expect(code).equals(expected);
    });
    
    it('simplifySubExp', function(){
        var code;
        
        tree = ast.parse("./tests/mock/return.js");
        code = ast.dump(cfg.simplifySubExp(tree.body[0]));
        console.log(code);
    });
    
    it('computeCFG', function(){
        var dot;
        
        tree = ast.parse("./tests/mock/cfg.js");
        tree = cfg.computeCFG(tree);
        //dot = cfg.dump(tree);
        //console.log(dot);
    });
    
    
})
