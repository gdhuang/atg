
Automatic Test Generation (atg)
===

Atg is an unit test generation tool for node.


##Usage
#### Installation
To use atg, simply install it as a node program.
Besides, we adopt mocha test framework, chai assertion library, and sinon mock library in the generated tests, so please install them also.

```
$ npm install --global atg
$ npm install --global mocha
$ npm install --global chai
$ npm install --global sinon
```

#### Annotation

You can annotate functions with specific leading comments.
Atg will generate unit tests for the annotated functions.

```js
/* allen */
function a() {};

/* allen */
var b = function() {};
```

The comments starts with "allen" and followed by a semicolon-separated list of options.

#### Execution


To instrument your program, simply run atg against your working directory.

```
$ atg working_directory 
```

You can execute your program, which is instrumented by atg.
The instrumented functions will record input/output and then dump tests in working_directory/tests/unit/.

To execute generated tests, you need to revert instrumentation.
Otherwise, tests will call instrumented functions and another set of tests will be generated.

```
$ atg -r working_directory 
```

Now, you can call mocha to run the unit tests.

```
$ mocha tests/unit/* --reporter spec
```


## Demo/Development

For demo/development purpose, you can clone atg and install it as a symbolic link.

```
$ cd atg; sudo npm link; npm link atg;
```

To execute demo, simply run

```
$ npm test
```

In demo/ directory, there are two js files,

* demo.js, which is a demo module annotated for atg, and

* driver.js, which is sample code of API from demo module.

You can check the generated tests in tests/unit/demo/.





