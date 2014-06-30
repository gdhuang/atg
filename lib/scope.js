'use strict';

var esprima = require('esprima'),
    esmorph = require('esmorph'),
    escodegen = require('escodegen'),
    config = require('config'),
    log4js = require('log4js'),
    logger = log4js.getLogger("scope.js");
    
log4js.configure(config.log4js);

function analysis(funNode, symbolTable) {
    var result = [];

    traverse(tree, function (node, path) {
        
        node.type === esprima.Syntax.FunctionDeclaration ||
              node.type === esprima.Syntax.FunctionExpression
    
        return true;
    });

    return result;    
    
}

function Scope() {
    this.variables = null;
    this.functioins = null;
    this.parent_scope = null;
}