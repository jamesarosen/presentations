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

Our goal is to have continuous deployment, which might look like

```bash
bundle update && \
  rake test && \
  git commit -m "updating gems" && \
  git push && \
  cap deploy
```

### Pattern: Single Namespace per Engine

In order to avoid conflicts, each engine gets a single short name. The engine
uses that name *everywhere*. For example the Account Provisioning engine
uses the `Zendesk::Provisioning` Ruby namespace and prefixes all its
database tables and I18n keys with `provisioning_`. It also owns three URL
prefixes:

 * `/provisioning` for standard Rails HTML pages
 * `/assets/provisioning` for all assets
 * `/api/v*/provisioning` for API endpoints

Since Carson is a Rails application, it will automatically load the `routes.rb`
file from each engine. Unfortunately, this isn't true of nginx. We're currently
working on a Capistrano task that will look for `config/nginx.conf` files
in each of the gems and write a new `nginx.conf` file to the server on deploy.

### Global State

Rails applications have a great deal of global state. Some examples include
`I18n.locale`, `I18n.backend`, the set of translations, the list of Rack
middleware, and the MIME type mappings. Any time an engine changes this global
state, it risks breaking all the other engines. For example, we had a problem
where one engine setting `I18n.backend` to a backend that first checked our
central translation service and then fell back on that engine's
`config/locales/*.yml` files. This caused all the other engines to lose their
default translations.

Instead, your teams should agree on some convention, encode that convention
as a gem, and load the gem in the host environment. The engines can also load
it in their test environments. In the `I18n.backend` case, our convention was
that the backend would check the translation server first, then fall back on
all of the engines' `config/locales/*.yml` files. We encoded that as a public
method in our `zendesk_i18n` gem and called that method in an initializer in
Carson.

### Antipattern: Shared, Mutable Objects

In late 2011, Reg Braithwaite wrote a
[lovely article](http://github.com/raganwald/homoiconic/blob/master/2011/11/COMEFROM.md)
titled "Williams, Master of the 'Come From'." He described a coworker who
practiced a rather extreme form of decoupling. Many Rails programmers, when
faced with the task of relating people to comments might write

```ruby
class Person
  has_many :comments
end

class Comment
  belongs_to :person
end
```

Williams, instead, would break these two concerns into modules. The people
module knows nothing about comments:

```ruby
class People::Person
end
```

and the comment module knows about both:

```ruby
class Commenting::Comment
  belongs_to :author, :class_name => 'People::Person'
end

People::Person.class_eval do
  has_many :comments, :class_name => 'Commenting::Comment'
end
```

At first glance, this mechanism seems rather well suited to the Carson mindset.
The person-management engine doesn't care how many extra features you add in;
each feature can manage itself. If any engine can monkey-patch `Person`,
however, it can change the behavior of the people system. By adding a bad
validation, it could prevent new signups.

The cause of this problem is that the commenting engine isn't obeying a cardinal
rule: *if it's not your data and it's not your code, you can't change it.* There
are at least two good ways to keep this separation of concerns while obeying
this rule. The first is to build your own read-only model backed by the same
data:

```ruby
class Commenting::Author
  self.table_name = 'people'

  has_many :comments, :class_name => 'Commenting::Comment'

  def readonly?
    true
  end
end

class Commenting::Comment
  belongs_to :author, :class_name => 'Commenting::Author'
end
```

With this implementation, the commenting system depends on two things from the
people system: that there's a table named "people" and that it has a primary-key
column named "id". Those are relatively stable things, so this is a reasonable
dependency. If the commenting system needs more information from the people
system (names, roles, etc.), then that dependency becomes increasingly unstable.
In that case, it's better to use option two.

The second is to have the people expose a public API that other engines can
use:

```ruby
class People::Person
  def self.lookup(id)
    find(id).tap do |person|
      def person.readonly?
        true
      end
    end
  end
end
```

Here, the commenting system depends on the name of the `People::Person` class,
that that class responds to `lookup`, and that `lookup` takes a single `id`
parameter. These, too, are fairly stable dependencies. Overall, this is a
better solution than the direct-table-lookup version, and even more so if the
commenting system needs more than just an ID to reference.

The other benefit to this approach is that it makes it easier to transition to
*real* SOA in the future. All you have to do is replace `People::Person.lookup`
with a version that makes an HTTP call and you can separate the services.

 * Communication among engines
   * ActiveSupport::Notifications
 * Deployment
   * Single Capistrano file
   * 1 thing for Ops to scale
     * Can't scale engines independently
 * Dependency management
   * It's Fun!
   * formalized vs. MonoRails
   * more coordination cost than SOA
 * Further reading
   * https://github.com/jamesarosen/presentations/tree/master/carson
   * http://www.slideshare.net/jackdanger/monorails-gogaruco-2012
   * http://confreaks.com/videos/1125-gogaruco2012-mega-rails
   * http://en.wikipedia.org/wiki/Conway's_Law
   * http://thunderboltlabs.com/posts/soa-antipattern-centralized-db
   * http://github.com/raganwald/homoiconic/blob/master/2011/11/COMEFROM.md
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