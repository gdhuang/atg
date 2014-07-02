'use strict';

var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    assert = require('assert'),
    esprima = require('esprima'),
    esmorph = require('esmorph'),
    escodegen = require('escodegen'),
    randomstring = require("randomstring"),
    graphviz = require("graphviz"),
    ast = require('./ast'),
    visitor = require('./visitor'),
    beautify = require('js-beautify').js_beautify,
    UglifyJS = require("uglify-js"),
    dust = require('dustjs-linkedin'),
    config = require('config'),
    log4js = require('log4js'),
    logger = log4js.getLogger("cfg.js");
    
log4js.configure(config.log4js);



function blocklize(tree) {
    var wrapBlock = function(node, bodyField) {
        var body = node[bodyField],
            block = {};
            
        if(!body || body.type === esprima.Syntax.BlockStatement)
            return;
            
        block.type = esprima.Syntax.BlockStatement;
        block.body = [body];      
                
        node[bodyField] = block;
        
        body.parent = block;
        block.parent = node;
    };

    
    visitor.traverse(tree, function (node, path) {
        if(node.type ===  esprima.Syntax.WhileStatement ||
           node.type === esprima.Syntax.DoWhileStatement ||
           node.type === esprima.Syntax.ForStatement ||
           node.type === esprima.Syntax.ForInStatement) {
            wrapBlock(node, 'body');
        } else if(node.type === esprima.Syntax.IfStatement) {
            wrapBlock(node, 'consequent');
            wrapBlock(node, 'alternate');
        }
    });
    
    return tree;

}

function simplifySubExp(tree) {

    logger.info('simplifySubExp');

    var funList = ast.getFunList(tree);

    tree = blocklize(tree);

    funList.forEach(function(funNode) {
        var list = visitor.collect([esprima.Syntax.ReturnStatement, esprima.Syntax.CallExpression], funNode, {skipInnerFunction: true});

        list.forEach(function(stmtOrExp) {
            visitor.traverse(stmtOrExp, function (arg, path) {
                var tmpVar,
                    varDecl,
                    assignExp,
                    assignStmt;

                if(path.length===0 || ast.isSymbol(arg) || arg.type===esprima.Syntax.MemberExpression)
                    return;

                tmpVar = '_'+randomstring.generate(5);
                varDecl = ast.mkVariableDeclaration(tmpVar);
                ast.insertBefore(ast.getEntry(funNode), varDecl);


                assignExp = ast.mkAssignmentExpression('=', tmpVar, ast.copy(arg));
                assignStmt = ast.mkExpressionStatement(assignExp);           
                ast.insertBefore(stmtOrExp, assignStmt);

                return {
                    msg: visitor.Action.ReplaceChildren,
                    data: varDecl.declarations[0].id
                };
            });
        });
    });


    return tree;
}


function link(src, dst) {
    if(typeof src.succs === 'undefined')
        src.succs = [];
    
    if(src.succs.indexOf(dst) == -1)
        src.succs.push(dst);
    
    if(dst === null)
        return;
        
    if(typeof dst.preds === 'undefined')
        dst.preds = [];
    
    if(dst.preds.indexOf(src) == -1)
        dst.preds.push(src);
}

function computeCFG(tree) {
    var funList, blockList;
    
    tree = blocklize(tree);

    succpred_block(tree.body, null);
    
    funList = visitor.collect([esprima.Syntax.FunctionDeclaration, esprima.Syntax.FunctionExpression], tree);
    funList.forEach(function(node) {
        if(node.body.length > 0) {
            succpred_block(node.body, null);
        }
    });
    
    blockList = visitor.collect([esprima.Syntax.ForStatement, 
                                 esprima.Syntax.WhileStatement,
                                 esprima.Syntax.DoWhileStatement, 
                                 esprima.Syntax.ForInStatement], tree);
    blockList.forEach(function(node) {
        var block = node.body;
        if(block.body && block.body.length > 0) {
            succpred_block(block.body, node);
        }
    });

    return tree;
}

function succpred_block(body, fallthrough) {
    var i;

    assert.ok(body.length > 0);
    for(i=0; i<body.length-1; i++) {        
        succpred_stmt(body[i], body[i+1]);
    }
    
    succpred_stmt(body[i], fallthrough);
}


function succpred_stmt(node, fallthrough) {
    var i;
    
    if(node.type === esprima.Syntax.BlockStatement) {
        if(node.body.length == 0) {
            link(node, fallthrough);
        } else {
            link(node, node.body[0]);
            succpred_block(node.body, fallthrough);
        }
    } else if(node.type === esprima.Syntax.IfStatement) {
        if(!node.consequent || node.consequent.body.length == 0) {
            link(node, fallthrough);
        } else {
            link(node, node.consequent.body[0]);
            succpred_block(node.consequent.body, fallthrough);
        }
    
        if(!node.alternate || node.alternate.body.length == 0) {
            link(node, fallthrough);
        } else {
            link(node, node.alternate.body[0]);
            succpred_block(node.alternate.body, fallthrough);
        }
    } else if(node.type === esprima.Syntax.ForStatement ||
              node.type === esprima.Syntax.WhileStatement ||
              node.type === esprima.Syntax.DoWhileStatement ||
              node.type === esprima.Syntax.ForInStatement) {
        link(node, fallthrough);
    } else if(node.type === esprima.Syntax.BreakStatement ||
              node.type === esprima.Syntax.ContinueStatement ||
              node.type === esprima.Syntax.ReturnStatement ||
              
              node.type === esprima.Syntax.ExpressionStatement ||
              node.type === esprima.Syntax.FunctionDeclaration ||
              node.type === esprima.Syntax.VariableDeclaration ||
              node.type === esprima.Syntax.LabeledStatement ||
              node.type === esprima.Syntax.ThrowStatement ||
              node.type === esprima.Syntax.EmptyStatement) {
        link(node, fallthrough);
    } else if(node.type === esprima.Syntax.SwitchStatement ||
              node.type === esprima.Syntax.TryStatement ||
              node.type === esprima.Syntax.WithStatement) {
        throw "cfg.js, succpred_stmt: unsupported statement";
    }
    else {
        throw "cfg.js, succpred_stmt: unsupported statement";
    }

}

function dump(tree) {
    var graph = graphviz.digraph(path.basename(tree.filename, '.js')),
        nodeLabel = function(node) {           
            if(node === null)
                return null;
            else
                return util.format('%d_%s', node.loc.start.line, node.type);
        };
        
    visitor.traverse(tree, function (node, path) {  
        if(node.type === esprima.Syntax.ForStatement ||
          node.type === esprima.Syntax.WhileStatement ||
          node.type === esprima.Syntax.DoWhileStatement ||
          node.type === esprima.Syntax.ForInStatement) {
          
          if(node.body.body.length > 0)
              graph.from(nodeLabel(node)).to(nodeLabel(node.body.body[0]));
          else
              graph.from(nodeLabel(node)).to(nodeLabel(node));
        }
            
        if(!node.succs)
            return;
        
        node.succs.forEach(function(succ) {
            if(!succ)
                return;

            graph.from(nodeLabel(node)).to(nodeLabel(succ));
        });
    });

    graph.render('png', graph.id+'.png');
    return graph.to_dot();
}

module.exports = {
    blocklize: blocklize,
    simplifySubExp: simplifySubExp,
    computeCFG: computeCFG,
    dump: dump
};
