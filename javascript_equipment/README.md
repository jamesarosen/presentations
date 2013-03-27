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
