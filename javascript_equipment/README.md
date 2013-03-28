## Tools Philosophy

The most important feature of your tools is that the work. Broken tools are
worse than no tools. After correctness, speed is of utmost concern. You'll be
bulding, checking, testing, packaging, and deploying your code hundreds if not
thousands of times per day.

Of course, there may be parts of the process that are extremely difficult to
speed up. For those cases, I find it best to *use* the slowness as a feature.
Instead of impatiently staring at a slow test suite, go enjoy a cup of çai or
listen to some music. In five (or thirty) minutes, you can come back to your
work in a better state of mind.

I often see people recreate existing tools in new languages. There are many
good reasons to do this, but your tools don't *have* to be in the same language
as your code.

Putting these guidelines together, I arrive at the following philosophy:
*build your tools in the fastest language that you're likely to get right.* This
talk will start off running tools from the (Unix) command line. As the tasks get
increasingly complex, we will move up the abstraction stack through shell
scripting, Make, and Grunt.

## Product: `insistent_cat.js`

In the course of this talk, we will be working on a small jQuery library that
addresses the following Cat User Story:

> As a cat,
>
> I want to be directly under your hand, wherever it happens to be, regardless
> of what you are doing, all the time
>
> So that I epitomize catness.
> - [@catuserstories](https://twitter.com/catuserstories/status/311275434669142019)

When the jQuery plugin is run, it will insert an `<img/>` tag into the DOM that
follows the cursor. It prevents all clicks just like a cat gets in your way.

## JSHint

JSHint is the *sine qua non* of JavaScript development. It will do more than
any other tool to help you write correct, maintainable code. After installing
[NodeJS](http://nodejs.org/), install JSHint with `npm install -g jshint`. Run
JSHint on a single file with `jshint assets/insistent_cat.js`.

If you are working on multiple projects, there will come a time when you want
to use a different version of JSHint on each one. To do so, install JSHint
*locally* instead of *globally*. Add the following to the `package.json` file
in your project:

    "devDependencies": {
      "jshint": "~1.1.0"
    }

Then install with `npm install`, ignoring the warning about `-g`. To use the
local version from the commandline, run
`node_modules/jshint/bin/hint myFile.js`.

For bonus points, work JSHint into your editor of choice; you can bind it to
a keyboard shortcut or have it run every time a file is saved. Additionally,
you can add it to a git pre-commit hook and your continuous integration server.

## Working with Multiple Files

As your project grows, you'll want to break it up into multiple files. As soon
as you do, you'll need two things:

 1. a way to run your checks (JSHint, unit tests, etc.) on each file
 1. a way to compile the files into one deliverable unit (at least for
    browser libraries)

We can address (1) by adding `find` and `xargs` to our toolset:

    find src/ -name *.js | xargs node_modules/jshint/bin/hint

This command is getting pretty complex, though. We'll move it to a shell script
in `script/jshint`

    #!/bin/sh
    find src/ -name *.js | xargs node_modules/jshint/bin/hint

Next, we'll use `cat` to concatenate the source files:

    cat src/file1.js \
        src/file2.js \
        > build/library.js

We'll put this in `script/compile`. There's a problem with using `cat` for
browser projects, though. You'll want to wrap your code in an
<abbr title="Immediately-Invoked Function Expression">IIFE</abbr> so you don't
pollute the global namespace:

    (function(window, $) {
      // code
    }(this, this.jQuery));

The easiest thing that could work would be using `echo` to add the header and
footer:

    #!/bin/sh
    outfile="build/library.js"
    echo "(function(window, $) {"   >  $outfile;
    cat  src/file1.js               >> $outfile;
    cat  src/file2.js               >> $outfile;
    echo "}(this, this.jQuery));"   >> $outfile;

We put everything together in `script/build`:

    #!/bin/sh
    script/jshint && script/compile

This is sufficient for projects with just a couple of files; more complex
projects can benefit from a module system.

## Module Systems

There are several different module systems in the JavaScript world, including
<abbr title="Asynchronous Module Definition">AMD</abbr>,
<abbr title="ECMAScript 6">ES6</abbr> modules, and CommonJS. Mikito Takada
discusses the pros and cons of each in his book,
[Single Page Apps in Depth](http://singlepageappbook.com/). I'm going to use
CommonJS here, for the following reasons:

 * module names needn't be globally unique, so multiple libraries can define
   a `lib/utils.js` module
 * the list of CommonJS libraries is very large (though the subset targetting
   browsers is much smaller)
 * we're already using `npm` to manage our development dependencies

To turn modules from individual files into a single, browser-friendly library,
we need two things:

 1. an implementation of `require` that runs in the browser
 1. a way to turn a file into a defined module, consumable via `require`

Two nice optional features are

 1. a way to convert globals (like `window.jQuery` or `Math.PI`) into
    `require`-able modules
 1. a way to export a "main" module as a global

To define a module, you set `module.exports` in a file:

    // in lib/cat_image.js
    module.exports = function buildCatImage(src, options) {
      // ...
    };

To consume it from another module, you use `require`:

    var catImage = require('cat_image'),
        img = catImage('cat.jpg', { width: '2em' });

There are several different tools for turning CommonJS modules into a
single browser-friendly file, including [OneJS](https://github.com/azer/onejs),
[GlueJS](https://github.com/mixu/gluejs), and
[Browserify](https://github.com/substack/node-browserify). First, we'll try
writing one of our own.

We need an implementation of `require`. I particularly like the
[one from sprockets-commonjs](https://github.com/maccman/sprockets-commonjs/blob/master/lib/assets/javascripts/sprockets/commonjs.js). Its basic
structure is

    (function() {
      if (!this.require) {
        var require = function(name, root) {
          ...
        };
        require.define = function(bundle) {
          ...
        };
      }
    }).call(this);

Given this implementation, the following script (`script/commonjs2browser`) will
convert a CommonJS file into a defined module:

    #!/bin/sh
    filename="$1";
    echo "require.define(\"${filename}\","
    echo "  function(exports, require, module) {";
    cat  $filename;
    echo "});";

We can work that into our build system like so:

    #!/bin/sh
    js_files=$(find src -name *.js)

    echo "$js_files" | xargs jshint || exit 1;

    cat script/commonjs_shim.js > $outfile;

    for js_file in $js_files; do
      echo "$(script/cjs2browser $js_file)" >> $outfile;
    done

    echo "window.MyLibrary = require('src/module2.js');"

This system has some important weaknesses, though. First, the module names
are the same as the (relative) file paths. Second, we have to convert the module
to a global manually. We could fix the first with `sed` and the second with a
more sophisticated `script/commonjs2browser`, but it would be easy to introduce
bugs. It's time to move out of the realm of shell scripting.

To install Browserify locally, add `"browserify": "~2.8.0"` to the
`devDependencies` section in your `package.json`, then run `npm install`.
To convert a collection of CommonJS modules to a browser-friendly package,
call `browserify` with the "entry-point" module (the one you want to export
as a global).

Browserify doesn't have a way to automatically export a module to a global, so
we'll create a `src/main.js`:

    window.InsistentCat = require('./cat_follower');

Then, change `script/compile` to use Browserify for the compilation:

    #!/bin/sh
    ./node_modules/browserify/bin/cmd.js \
      src/main.js \
      > assets/insistent_cat.js

## Make

Using shell scripts for our build system works, but we're starting to outgrow
them. Let's bring in a dedicated build tool. You could use
[Jake](https://npmjs.org/package/jake) (JavaScript),
[Paver](http://paver.github.com/paver/) (Python), or
[Rake](http://rake.rubyforge.org/) (Ruby), but I'm going to start with
Make here. My favorite thing about Make is that shell commands are a
first-class citizen, so it's easy to work with tools written in any language.

Our build currently has two steps:

 1. Run JSHint on `src/*.js`
 1. If that passes, run `browserify` on `src/main.js`

The simplest `Makefile` we could write would be

    build:
      node_modules/jshint/bin/jshint src
      node_modules/browserify/bin/cmd.js \
        src/main.js \
        > assets/insistent_cat.js

### `.PHONY`

The first improvement would be to add

    .PHONY: build

This tells Make that `build` is a "virtual" target; runing it won't create a
file named `build`.

### Targets

Breaking the `Makefile` up into multiple targets promotes re-use.

    build: assets/insistent_cat.js

    assets/insistent_cat.js: jshint
      node_modules/browserify/bin/cmd.js \
        src/main.js \
        > assets/insistent_cat.js

    jshint:
      node_modules/jshint/bin/jshint src

    .PHONY: build jshint

We can still run `make` or `make build` to build `assets/insistent_cat.js`,
but we can also run `make jshint` to just run the JSHint checks.

### `$@`

Inside a target recipe, `$@` is the target name. We can use this to remove
some duplication:

    assets/insistent_cat.js: jshint
      node_modules/browserify/bin/cmd.js \
        src/main.js \
        > $@

### Variables

`assets/insistent_cat.js` is still in two places. Let's extract it:

    DIST_JS = assets/insistent_cat.js

    build: $(DIST_JS)

    $(DIST_JS): jshint
      node_modules/browserify/bin/cmd.js ...

### Cleanup

A `clean` target will make it easy for developers to clean up the repository:

    clean:
      -rm $(DIST_JS)

    .PHONY: build clean

The `-` at the beginning of the line tells Make that the `rm` command can fail
without causing the `clean` target to fail. That lets developers run
`make clean build` even if everything has already been cleaned up.

### Recording Events with Empty Target Files

One of the best features of Make (and other similar tools, like Rake) is that if
you use targets that represent files, it will automatically skip steps that are
up-to-date based on file `mtime`s. We can use this to speed up our build times.
Instead of running JSHint on *every* input file every time, we only need to run
it on the files that have changed. For each file in `src/`, we `touch`
a corresponding file in `tmp/lint_free/` to mark it as lint-free.

    SRC_DIR         = src
    LINT_FREE_DIR   = tmp/lint_free

    JS_FILES        := $(wildcard $(SRC_DIR)/*.js)
    LINTED_JS_FILES := $(JS_FILES:$(SRC_DIR)/%=$(LINT_FREE_DIR)/%)

    $(LINTED_JS_FILES): $(LINT_FREE_DIR)/%.js : $(SRC_DIR)/%.js $(LINT_FREE_DIR)
      node_modules/jshint/bin/jshint $<
      touch $@

    $(LINT_FREE_DIR):
      mkdir -p $@

    clean:
      -rm $(DIST_JS)
      -rm -rf $(LINT_FREE_DIR)

There's a lot of new stuff here. `JS_FILES` is the list of JS files in `src/`;
`LINTED_JS_FILES` is the corresponding list in `tmp/lint_free/`. We then define
a rule for turning the former into the latter. The special variable `$<` is the
rule's first dependency -- here, the file in `src/` that we're checking.

We'll run `make clean build` once:

    $ make clean build
    rm -rf tmp/lint_free
    mkdir -p tmp/lint_free
    node_modules/jshint/bin/jshint src/cat_follower.js
    touch tmp/lint_free/cat_follower.js
    node_modules/jshint/bin/jshint src/cat_image.js
    touch tmp/lint_free/cat_image.js
    node_modules/jshint/bin/jshint src/main.js
    touch tmp/lint_free/main.js
    node_modules/browserify/bin/cmd.js tmp/lint_free/main.js > assets/insistent_cat.js

If we then run `make` (or `make build`) again, it doesn't need to do anything:

    $ make
    make: Nothing to be done for `build'.

## Copyright

All material herein is Copyright Zendesk 2008-2012, with the following
exceptions:

 * `assets/odd_eyed_cat.jpg`, [Konstantinos Papakonstantinou](http://www.flickr.com/photos/ihasb33r/2573196546/)
 * `assets/broken_wrench.jpg`, [S. Benno](http://www.flickr.com/photos/9115274@N05/577382652/)
 * `assets/cheetah.jpg`, [ShootNFish](http://www.flickr.com/photos/geyring/5290188093/)
 * `assets/polyglot.jpg`, [Anya Quinn](http://www.flickr.com/photos/quinnanya/5383598076/)
 * `assets/turkish_tea.jpg`, [mbgrigby](http://www.flickr.com/photos/mbgrigby/5161070259/)
 * `assets/motorcycle_stunt.jpg`, [Fernando de Sousa](http://www.flickr.com/photos/fernando/3381914087/)
 * `script/commonjs_shim.js`, [Alex MacCaw](https://github.com/maccman/sprockets-commonjs/blob/master/lib/assets/javascripts/sprockets/commonjs.js)

## Links

 * https://github.com/trek/ember-todos-with-build-tools-tests-and-other-modern-conveniences
 * http://robots.thoughtbot.com/post/39679772184/capybara-webkit-now-more-stable-than-ever
 * http://discuss.emberjs.com/t/what-build-tools-are-you-guys-using/113
 * http://wibblycode.wordpress.com/2013/01/01/the-state-of-javascript-package-management/
 * http://shapeshed.com/let_tools_define_javascript_style/
 * http://casperjs.org/api.html#tester
 * https://developers.google.com/chrome-developer-tools/docs/console
 * https://npmjs.org/package/grunt-useref
 * https://github.com/sokolovstas/SublimeWebInspector
 * http://gruntjs.com/getting-started
 * http://weblog.bocoup.com/introducing-grunt/
 * https://github.com/yeoman/yeoman/wiki
 * https://github.com/h5bp/node-build-script/commit/af604dae37925d79a3b4068f71e4813901dca1e9
 * https://npmjs.org/package/grunt-rev-package
 * https://npmjs.org/package/grunt-rev-md5
 * https://npmjs.org/package/grunt-rev
 * https://github.com/cbas/grunt-rev/blob/master/tasks/rev.js
 * https://github.com/Luismahou/grunt-hashres/
 * https://npmjs.org/package/browserify
 * https://github.com/gruntjs/grunt-contrib-jshint
 * https://github.com/mixu/gluejs
 * http://addyosmani.com/blog/devtools-extensions-for-webapp-developers/
