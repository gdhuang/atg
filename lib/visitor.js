var esprima = require('esprima'),
    esmorph = require('esmorph'),
    escodegen = require('escodegen'),
    config = require('config'),
    log4js = require('log4js'),
    logger = log4js.getLogger("visitor.js");
    
log4js.configure(config.log4js);

var Action = {
    SkipChildren: 'SkipChildren',
    DoChildren: 'DoChildren',
    ReplaceChildren: 'ReplaceChildren'
};

function traverse(object, visitor, path) {
    var key, child, action;

    if (typeof path === 'undefined') {
        path = [];
    }

    if(object.type)
        action = visitor.call(null, object, path);

    if(action === Action.SkipChildren) {
        return;
    }
    else if(action && action.msg === Action.ReplaceChildren) {
        return action;
    }
    else {//if(action === Action.DoChildren) {
        for (key in object) {
            if (object.hasOwnProperty(key) && key!=='parent' && key!=='succs' && key!=='preds') {
                child = object[key];
                if (typeof child === 'object' && child !== null) {
                    action = traverse(child, visitor, [object].concat(path));

                    if(action && action.msg === Action.ReplaceChildren) {
                        object[key] = action.data;
                    }
                }
            }
        }
    }
}


function collect(typesOrFilter, tree, options) {
    var result = [],
        types = typesOrFilter,
        filter = typesOrFilter;
        
    if(typesOrFilter instanceof Array) {   
        filter = function(node, path) {
            for(var i in types) {
                if(node.type === types[i]) {
                    return true;
                }
            }
            return false;
        };
    }
    
    traverse(tree, function (node, path) {
        if (filter(node, path)) {
            result.push(node);
        }
        
        if(options && options.skipInnerFunction && 
            (node.type === esprima.Syntax.FunctionDeclaration ||
            node.type === esprima.Syntax.FunctionExpression) &&
            path.length !== 0) {
            return Action.SkipChildren;
        }
        
        return Action.DoChildren;
    });
    return result;
}

module.exports = {
    Action: Action,
    traverse: traverse,
    collect: collect
};