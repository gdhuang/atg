'use strict';

var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    assert = require('assert'),
    mkdirp = require('mkdirp'),
    dust = require('dustjs-linkedin'),
    dust = require('dustjs-helpers'),
    beautify = require('js-beautify').js_beautify,
    util = require('util');


var store = {};


function genUUID() {
    var len = 5;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


function setup(uuid, filePath, funName) {
    store[uuid] = {
        filePath : filePath,
        funName: funName,
        input: {
            arguments: [],
            context: {}
        },
        output: {
            return: {},
            context: {}
        },
        callback: {
            name: '',
            arguments: []
        }
    };
}

function dIn(uuid, type, name, value) {
    if(type == 'arguments')
        store[uuid]['input'][type].push({name: name, value: value});
    else
        store[uuid]['input'][type][name] = value;
}

function dOut(uuid, type, name, value) {
    if(type === 'return') {
        assert.ok(!store[uuid]['output'][type].name);
        store[uuid]['output'][type] = {name: name, value: value};
    } else
        store[uuid]['output'][type][name] = value;
}

function dCb(uuid, fname) {
    store[uuid]['callback'].name = fname;

    for(var i=2; i<arguments.length; i++) {
        store[uuid]['callback'].arguments.push(JSON.stringify(arguments[i]));
    }
}

function genTest(uuid) {    
    var sutFilePath = store[uuid].filePath,
        testdir = 'tests/unit/',
        testFilePath = util.format(testdir+'%s-%s.js', sutFilePath, uuid),
        template = 'template/test.template',
        compiled = dust.compile(fs.readFileSync(template,'UTF-8'), "template"),
        params,
        result;
        
    params = {
        filePath: path.relative(path.dirname(testFilePath), sutFilePath),
        fileName: path.basename(sutFilePath),
        funName: store[uuid].funName
    };

    //input
    params.arguments = [];
    store[uuid]['input'].arguments.forEach(function(arg) {
        
            
        /*if(typeof arg.value === 'function') {
            return;
        }
        else */if(arg.value === undefined)
            params.arguments.push({name: arg.name, value: 'undefined'});
        else
            params.arguments.push({name: arg.name, value: JSON.stringify(arg.value)});
    });

    //return
    if(store[uuid]['output']['return'].name) {
        params.return = JSON.stringify(store[uuid]['output']['return'].value);
    }

    //callback
    if(store[uuid]['callback'].name) {
        params.callback = {};
        params.callback.name = store[uuid]['callback'].name;
        params.callback.arguments = store[uuid]['callback'].arguments;
    }

    //render
    dust.loadSource(compiled);
    dust.render("template", params, function(err, out) {
        result = beautify(out, { indent_size: 4 });
    });
    
    mkdirp.sync(path.dirname(testFilePath));
    fs.writeFileSync(testFilePath, result);
}

module.exports = {
    VNAME: 'atg',
    ARGUMENTS: 'arguments',
    CONTEXT: 'context',
    RETURN: 'return',
    SETUPFUN: 'atg.setup',
    INDUMPFUN: 'atg.dIn',
    OUTDUMPFUN: 'atg.dOut',  
    CBDUMPFUN: 'atg.dCb',  
    GENTESTFUN: 'atg.genTest',     
    UUIDFUN: 'atg.genUUID',
    UUIDVAR: 'F4_13',  
    FILEVAR: 'FILEPATH',
    genUUID: genUUID,
    setup: setup,
    dIn: dIn,
    dOut: dOut,
    dCb: dCb,
    genTest: genTest
};
    