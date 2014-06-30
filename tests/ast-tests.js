'use strict';

var esprima = require('esprima'),
    expect = require("chai").expect,
    ast = require('../lib/ast.js');

describe('ast.js', function(){
    var tree, functionList, varList, node, comment, v;
    
    before(function () {
        
    });
    
    it('parse', function(){


        tree = ast.parse("./tests/mock/functions.js");
        expect(tree).to.exist;
        expect(tree.loc).to.exist;
        expect(tree.range).to.exist;
    });
    
    it('dump', function(){
        var tmp = '/tmp/tmp.js';
        ast.dump(tree, tmp);
        tree = ast.parse(tmp);
        expect(tree).to.exist;
        expect(tree.loc).to.exist;
        expect(tree.range).to.exist;
    });
    
    it('copy', function(){
        node = ast.copy(tree);
        expect(node.type).equals(esprima.Syntax.Program);
    });
    
    it('getLeadingComments', function(){
        comment = ast.getLeadingComments(tree.body[1]);
        expect(comment).to.exist;
    });
    
    it('mkVariableDeclaration', function(){
        v = ast.mkVariableDeclaration('v1','init()');
        expect(v.type).equals(esprima.Syntax.VariableDeclaration);
        expect(v.declarations[0].id.name).equals('v1');
        expect(v.declarations[0].init.type).equals(esprima.Syntax.CallExpression);
    });
    
})
