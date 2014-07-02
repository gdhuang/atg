'use strict';

var fs = require('fs'),
    assert = require('assert'),
    esprima = require('esprima'),
    esmorph = require('esmorph'),
    escodegen = require('escodegen'),
    beautify = require('js-beautify').js_beautify,
    UglifyJS = require("uglify-js"),
    visitor = require('./visitor'),
    config = require('config'),
    log4js = require('log4js'),
    logger = log4js.getLogger("ast.js");
    
log4js.configure(config.log4js);


function ugly(filename) {
    var code = fs.readFileSync(filename, 'utf-8'),
        ast = UglifyJS.parse(code);
        
    ast.figure_out_scope();
    return ast.print_to_string();
}

function parse(str){
    var filename = str,
        code = str,
        ast;

    if(fs.existsSync(filename)) {
        code = fs.readFileSync(filename, 'utf-8');        
    } else {
        filename = '';
    }
    try {
        ast = esprima.parse(code, { comment: true, tokens: true, range: true, loc: true });
    } catch (err) {
        logger.error('fail to parse:' + code);
        throw err;
    }
    ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
    ast.filename = filename;
    visitor.traverse(ast, function (node, path) {
        for(var i=0; i<path.length; i++) {
            if(typeof path[i].type !== 'undefined') {
                node.parent = path[i];
                break;
            }
        }
        
    });
    
    return ast;
}


function dump(node, filename, options) {
    var code = escodegen.generate(node, {comment: true});
    
    if(options && options.beautify) {
        code = beautify(code, { indent_size: 4 });
    }
    
    if(typeof filename !== 'undefined') {
        fs.writeFileSync(filename, code);
    }
    
    return code;
}


function getEntry(node) {

    if(isFunction(node))
        return node.body.body[0];
    else if(node.type === esprima.Syntax.Program) {
        if(node.body[0].expression && node.body[0].expression.value==='use strict')
            return node.body[1];
        else 
            return node.body[0];
    }
    assert.ok(!'ast.getEntry only accepts fun node and Program node');
}

function getLeadingComments(node) {
    var parent = node.parent,
        comments;
    
    if(node.leadingComments || isStatement(node)) {
        comments = node.leadingComments ? node.leadingComments : [];
    } else if (parent) {
        comments = getLeadingComments(parent);
    } else {
        comments = [];
    }

    return comments;
}

function getFunList(tree) {
    return visitor.collect([esprima.Syntax.FunctionDeclaration, esprima.Syntax.FunctionExpression], tree);
}

function isFunction(node) {
    return node.type &&
           (node.type === esprima.Syntax.FunctionDeclaration ||
            node.type === esprima.Syntax.FunctionExpression
           );
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function isStatement(node) {
    return node.type && 
           (node.type.endsWith("Statement") ||
            node.type === esprima.Syntax.VariableDeclaration  || 
            node.type === esprima.Syntax.FunctionDeclaration
           );
}

function isExpression(node) {
    return node.type && 
           (node.type.endsWith("Expression") ||
            node.type === esprima.Syntax.Identifier ||
            node.type === esprima.Syntax.Literal ||
            node.type === esprima.Syntax.VariableDeclarator
           );
}

function isSymbol(node) {
    return node.type &&
           (node.type === esprima.Syntax.Identifier ||
            node.type === esprima.Syntax.Literal
           );

}

function copy(node) {
    var code = dump(node),
        program = function() {
            return parse(code);
        }
    
    if(node.type === esprima.Syntax.ObjectExpression ||
       node.type === esprima.Syntax.FunctionExpression) {
        return parse('('+code+')').body[0].expression;
    }
    else if(node.type === esprima.Syntax.Program) {
        return program();
    } else if(isStatement(node)) {
        return program().body[0];
    } else if(isExpression(node)) {
        return program().body[0].expression;
    } else {
        throw new Error('Unknown type: ' + node.type);
    }
}

function cStmt(str) {
    var stmt;

    if(typeof str !== 'string') {
        return str;
    }
        
    stmt = parse(str).body[0];
    delete stmt.parent;
    return stmt;
}


function cExp(str) {
    var exp;
    
    if(typeof str !== 'string') {
        return str;
    }
        
    exp = parse(str).body[0].expression;
    delete exp.parent;
    return exp;
}

function mkComment(comment) {
    var node = {};
            
    node.type = 'Block';
    node.value = comment;
    
    return node;
}

function mkIdentifier(name) {
    var node = {};
            
    node.type = esprima.Syntax.Identifier;
    node.name = name;
    
    return node;
}


function mkLiteral(value) {
    var node = {};
            
    node.type = esprima.Syntax.Literal;
    node.value = value;

    if(typeof value === 'string')
        node.raw = "'"+value+"'";
    else
        node.raw = value;
            
    return node;
}

function mkVariableDeclaration(id, init) {
    var node = {},
        declarator = {};
        
    node.type = esprima.Syntax.VariableDeclaration;
    node.kind = 'var';
    node.declarations = [declarator];
    declarator.type = 'VariableDeclarator';
    declarator.id = cExp(id);    
    declarator.init = cExp(init);

    declarator.id.parent = declarator;
    if(declarator.init)
        declarator.init.parent = declarator;
    declarator.parent = node;
    
    return node;
}


function mkReturnStatement(argument) {
    var node = {};
    
    node.type= esprima.Syntax.ReturnStatement;
    node.argument = cExp(argument);
    
    node.argument.parent = node;
    return node;

}

function mkExpressionStatement(expression) {
    var node = {};
    
    node.type = esprima.Syntax.ExpressionStatement;
    node.expression = cExp(expression);
    
    node.expression.parent = node;
    return node;
}

function mkAssignmentExpression(op, left, right) {
    var node = {};
    
    node.type = esprima.Syntax.AssignmentExpression;
    node.operator = op;
    node.left = cExp(left);
    node.right = cExp(right);

    node.left.parent = node;
    node.right.parent = node;
    
    return node;
}

function mkCallExpression(callee, arg1, arg2, arg3) {
    var node = {},
        params;
    
    node.type = esprima.Syntax.CallExpression;
    node.callee = cExp(callee);
    node.arguments = [];
    for(var i=1; i<arguments.length; i++) {
        node.arguments.push(cExp(arguments[i]));
        node.arguments[i-1].parent = node;
    }
    
    return node;
}

function insertBefore(node, newStmts) {
    var body,
        pos;

    while(isExpression(node))
        node = node.parent;
    
    assert.ok(node.parent.body, 'fail to insertBefore: '+dump(node));

    body = node.parent.body;

    pos = body.indexOf(node);

    if(newStmts instanceof Array) {
        for(var i=0; i<newStmts.length; i++) {
            body.splice(pos+i, 0, newStmts[i]);
            newStmts[i].parent = node.parent
        }
    }
    else {
        body.splice(pos, 0, newStmts);
        newStmts.parent = node.parent
    }
}


module.exports = {
    ugly: ugly,
    parse: parse,
    dump: dump,
    
    getEntry: getEntry,
    getLeadingComments: getLeadingComments,
    getFunList: getFunList,

    isFunction: isFunction,
    isStatement: isStatement,
    isExpression: isExpression,
    isSymbol: isSymbol,

    cStmt: cStmt,
    cExp: cExp,
    copy: copy,
    mkComment: mkComment,
    mkIdentifier: mkIdentifier,
    mkLiteral: mkLiteral,
    mkVariableDeclaration: mkVariableDeclaration,
    mkReturnStatement: mkReturnStatement,
    mkExpressionStatement: mkExpressionStatement,
    mkAssignmentExpression: mkAssignmentExpression,
    mkCallExpression: mkCallExpression,
    
    insertBefore: insertBefore,

};

