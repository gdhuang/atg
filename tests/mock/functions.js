var fs = require('fs'),
    esprima = require('esprima'),
    esmorph = require('esmorph');


function traverse(object, visitor, path) {
    var key, child;

    if (typeof path === 'undefined') {
        path = [];
    }

    if(! visitor.call(null, object, path))
        return;
        
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor, [object].concat(path));
            }
        }
    }
}


var collectFunctions = function ff(tree) {
        var functionList = [];

        traverse(tree, function () {
            var node = arguments[0],
                path = arguments[1];

            if (node.type === esprima.Syntax.FunctionDeclaration ||
                node.type === esprima.Syntax.FunctionExpression) {
                functionList.push(node);
            }
            
            return true;
        });

        return functionList;
}
