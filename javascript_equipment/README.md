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

This is sufficient for projects with just a couple of files; more complex
projects can benefit from a module system.

## Copyright

All material herein is Copyright Zendesk 2008-2012, with the exception of
certain images, whose source is noted below.

 * `odd_eyed_cat.jpg`, [Konstantinos Papakonstantinou](http://www.flickr.com/photos/ihasb33r/2573196546/)
 * `broken_wrench.jpg`, [S. Benno](http://www.flickr.com/photos/9115274@N05/577382652/)
 * `cheetah.jpg`, [ShootNFish](http://www.flickr.com/photos/geyring/5290188093/)
 * `polyglot.jpg`, [Anya Quinn](http://www.flickr.com/photos/quinnanya/5383598076/)
 * `turkish_tea.jpg`, [mbgrigby](http://www.flickr.com/photos/mbgrigby/5161070259/)

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
