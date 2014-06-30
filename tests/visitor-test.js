'use strict';

var esprima = require('esprima'),
    expect = require("chai").expect,
    ast = require('../lib/ast.js'),
    visitor = require('../lib/visitor.js');

describe('visitor.js', function(){
    var tree, functionList, varList, node;
    
    before(function () {
        
    });
    
    it('collect', function(){
        tree = ast.parse("./tests/mock/functions.js");
        functionList = visitor.collect([esprima.Syntax.FunctionDeclaration], tree);
        expect(functionList.length).equals(1);
    });

    
})
