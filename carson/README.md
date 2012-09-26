# Carson

"Only lie about the future." -Johnny Carson, giving advice to politicians

"If it weren't for Philo T. Farnsworth, inventor of television, we'd still be
eating frozen radio dinners." -Johnny Carson

"I did not know that." -Johnny Carson

## Introduction

Zendesk was born five years ago as a fairly standard Rails 1.2 application. In
that time, we've upgraded Rails many times and added Resque, Sphinx, Solr,
ejabberd, Node.js, and other non-Rails services. Until very recently, though,
all of the Rails code was in one project and one runtime. This is the story
of how that has begun to change.

Over the years, Zendesks's main Rails application grew... a lot. Fortunately,
we had great engineers who ensured our test suite grew along with the app.
Unfortunately, this meant that our test suite got slow. *Really* slow. By
the Fall of 2011 (four years in), we were lucky if it ran in an hour.
"No worries," some say; "run the whole thing in CI and only run the few tests
you care about in development." Just booting the environment for a single
test took a minute. That really hurts the test-code cycle.

When tests are painful, you can either change the tests or change the code.
Adding something like Spork is a change to the test; it might make working on
the project better for a while, but it's just hiding the real problem: there's
something wrong with the code.

One thing we tried -- and I encourage everyone to do -- was break some tests
out to a "fast test suite." Corey Haines has a
[great talk](https://www.youtube.com/watch?v=bNn6M2vqxHE) about making your
tests fast, and it all rests on getting rid of slow dependencies (like Rails)
when running tests. We started this, but it wasn't enough. We really needed
to develop new features in separate codebases.

[Conway's Law](http://en.wikipedia.org/wiki/Conway's_Law) states that

> Organizations which design systems... are constrained to produce designs
> which are copies of the communication structures of these organizations.

This is probably the single most important point here. If you want to move to
a service-oriented architecture, you *must* break your team up into smaller
groups.

One of the first ventures into building features in separate projects was
"Sea Monster," our content-management system. This is a Rails 2 engine that
plugged into our existing infrastructure. Sea Monster is a very standard Rails
application, so it fit nicely in that architecture.

A later project, however, wasn't quite as nice a fit. Zendesk Apps was to
be an API back-end plus a ton of JavaScript, and Rails 2 doesn't give you
much support for assets from engines. (For those who haven't tried, it involves
running a `rake` task to import the assets into the app's `public/` folder
and then making sure those assets are in your asset compiler.) Rails 3's
asset pipeline (a.k.a. [Sprockets](https://github.com/sstephenson/sprockets))
does this much better. Thus, we decided it was time to start developing a
Rails 3 application.

One morning after we had proven the Zendesk Apps concept, I walked up to our
head of infrastructure, whom we'll call "Zaphod" and asked, "Hey, Zaphod. We're
getting close to the point where we want to start deploying Zendesk Apps. What
do I need to do to get a Rails 3 instance running in production?"

Zaphod looked at me like I had exactly the wrong number of heads. "Rails 3?
We're not prepared to provision, monitor, and scale an entirely separate set of
runtimes."

To which I responded, "But Zaphod, this is the way of the future. Service-
oriented architectures! The single-responsibility principle! Plus," and it's at
this point that I might have miscalculated how I was affecting Zaphod's stress
level, "we're going to add many more Rails processes soon."

Meetings were held. Coffee was drunk. And after some debate, we agreed on
going from one to two sets of Rails runtimes, but no more. Thus was born
Carson.

## What

Carson is a Rails 3.2 application, but it doesn't have any application code.
The repository consists of deployment scripts, some configuration files,
and a Gemfile. All feature work is done in engines. Cross-cutting concerns
like text manipulation or locale lookup go in non-engine gems on which the
engines depend.

## Benefits and Drawbacks

### Testing

Developers work in an isolated environment. Test suites can run in under a
minute and a single test can run in a second or two. Each engine has its
own project on the CI server, so build failure notifications go to exactly
the people who care.

The downside is that the tests aren't really running in a real environment.
Thus, it's important that we have at least a few integration tests for each
engine inside Carson. This ensures the engines don't step on one another's
toes, at least in known ways.

### Semantic Versioning

Because engines are gems that use semantic versioning, their deploy schedules
are decoupled. The version of each engine that gets deployed is fixed by
Carson's `Gemfile.lock`, not by what's in that engine's `master` branch. That
means that code doesn't linger in pull requests. If something can't go out yet,
the team simply keeps their version locked.

Of course, semantic versioning means that engines should be able to push patch
relases easily. If you publish the engines to a gem server, that's as easy as
running `bundle update my-engine` from the host application. If you don't,
even a patch deploy becomes a tedious process of updating git tags in the
`Gemfile`.

 * Rationale
   * Faster tests
   * Better isolation between teams
   * Ops restriction on number of runtimes
 * What it is: vertical slices of functionality, hosted in a Rails application
 * Communication among engines
   * Database
     * Danger!
   * Ruby Service APIs
   * HTTP APIs
   * ActiveSupport::Notifications
 * Globals
   * I18n.locale
   * I18n.backend
   * MIME types
   * Rack middleware
   * Core models: User, Account, &c;
     * each Carson gem has its own User & Account model, backed by the same tables
 * Deployment
   * Single Capistrano file
   * 1 thing for Ops to scale
     * Can't scale engines independently
 * Dependency management
   * It's Fun!
   * formalized vs. MonoRails
   * more coordination cost than SOA
   * goal: `cron bundle update && git commit -m "updating engines" && git push origin master && cap deploy`
   * *need* internal gem server
 * Database
   * all tables prefixed
   * can only write to own tables
   * can read from any, but try not to
 * URLs
   * engines own set of prefixes
     * /prefix
     * /api/v*/prefix
     * /assets/prefix
   * Microwave to federate nginx configurations
 * Further reading
   * https://github.com/jamesarosen/presentations/tree/master/carson
   * http://www.slideshare.net/jackdanger/monorails-gogaruco-2012
   * http://confreaks.com/videos/1125-gogaruco2012-mega-rails
   * http://en.wikipedia.org/wiki/Conway's_Law
   * http://thunderboltlabs.com/posts/soa-antipattern-centralized-db
   * http://github.com/homoiconic/blob/master/2011/11/COMEFROM.md
   * http://confreaks.com/videos/1115-gogaruco2012-go-ahead-make-a-mess
   * https://speakerdeck.com/u/skmetz/p/go-ahead-make-a-mess
   * https://www.youtube.com/watch?v=bNn6M2vqxHE
 * Image Credits
   * [Zaphod Lego](http://www.flickr.com/photos/bladewood/2839103821/)
   * [Stressed Eggs](http://www.flickr.com/photos/topgold/6273248505/)
   * [Cat Meeting](http://cheezburger.com/5833564416)
   * [Bulleit](http://www.flickr.com/photos/9525555@N07/6071862938/)
   * [Mess Graphs](https://speakerdeck.com/u/skmetz/p/go-ahead-make-a-mess)
   * [Sea Monster](http://www.flickr.com/photos/btsiders/74652478/)
   * [Sad Pumpkin](http://www.flickr.com/photos/nathaninsandiego/4061850729/)