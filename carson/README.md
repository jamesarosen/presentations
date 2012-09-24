# Carson

"Only lie about the future." -Johnny Carson, giving advice to politicians

"If it weren't for Philo T. Farnsworth, inventor of television, we'd still be
eating frozen radio dinners." -Johnny Carson

"I did not know that." -Johnny Carson

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
   * http://github.com/jamesarosen/presentations/blob/carson/README.md
   * http://www.slideshare.net/jackdanger/monorails-gogaruco-2012
   * http://en.wikipedia.org/wiki/Conway's_Law
   * http://thunderboltlabs.com/posts/soa-antipattern-centralized-db
   * http://github.com/homoiconic/blob/master/2011/11/COMEFROM.md