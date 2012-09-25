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

One morning, I walked up to our head of infrastructure, whom we'll call
"Zaphod" because *how cool would that be?*, and asked, "Hey, Zaphod. We're getting
close to the point where we want to start deploying Zendesk Apps. What do I
need to do to get a Rails 3 instance running in production?"

Zaphod looked at me like I had exactly the wrong number of heads. "Rails 3?
We're not prepared to provision, monitor, and scale an entirely separate set of
runtimes."

To which I responded, "But Zaphod, this is the way of the future. Service-
oriented architectures! The single-responsibility principle! Plus," and it's at
this point that I might have miscalculated how I was affecting Zaphod's stress
level, "we're going to add many more Rails processes soon."

Meetings were held. Coffee was drunk. And after some debate, we agreed on
going from one to two sets of Rails runtimes, but no more.



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
 * Testing
   * faster unit tests
   * need integration tests in container
 * Further reading
   * https://github.com/jamesarosen/presentations/tree/master/carson
   * http://www.slideshare.net/jackdanger/monorails-gogaruco-2012
   * http://confreaks.com/videos/1125-gogaruco2012-mega-rails
   * http://en.wikipedia.org/wiki/Conway's_Law
   * http://thunderboltlabs.com/posts/soa-antipattern-centralized-db
   * http://github.com/homoiconic/blob/master/2011/11/COMEFROM.md
 * Image Credits
   * [Zaphod Lego](http://www.flickr.com/photos/bladewood/2839103821/)
   * [Stressed Eggs](http://www.flickr.com/photos/topgold/6273248505/)
   * [Cat Meeting](http://cheezburger.com/5833564416)
   * [Bulleit](http://www.flickr.com/photos/9525555@N07/6071862938/)