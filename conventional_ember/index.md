# Conventional Ember

## Convention: Conventions are Terrible

## Overview

 * Ember is a framework of conventions
 * Buy into the conventions
 * Buy into the idea of conventions
   * you're not your own special snowflake
 * Start small
 * Plan for growth

## Ember

Ember has conventions for many things; follow them.
 * The guides are good, but only if you follow the conventions
 * The framework itself guides new developers, but only if you follow the conventions

Ember lacks conventions for some things; create a convention for these and be prepared to migrate when they solidify. Zendesk didn't think we were our own special snowflake, but few conventions existed when we started using Ember; now our code is *extremely* un-Ember-like. That makes it hard to onboard and hard to use community tools. Some examples:

 * services, cf http://discuss.emberjs.com/t/services-a-rumination-on-introducing-a-new-role-into-the-ember-programming-model/4947/14
 * lazily-loaded areas
 * non-routable state

Patterns & Anti-patterns in large Ember apps

 * Convention: Always Be Upgrading
    * The Ember team are performance-minded; you'll get free speed boosts!
    * The Ember community is rapidly evolving; it's easy to fall behind and not be able to take advantage of the community
 * Convention: use an AJAX wrapper
    * Ember-Data, Ember-Model, Ember-Persistence-Framework, Ember-Resource
    * Or just your own wrapper, even if very thin
 * Convention: serve dynamic HTML from server; prepopulate API data
 * Convention: lazily load major portions of your app ("activities")
    * use an asset loader. `$.getScript` removes the script from the page, so you can't use browser dev tools on it
    * even better: semantically versioning activities
 * Convention: prefer Router-mediated events
    * don't share objects across areas directly
    * hard to enforce since one shared Container gives access to all; consider injecting a sub-container into each activity
 * Convention: use generic `Component`s -- write them or use something like `ic`
 * Convention: write domain-specific `Component`s in each area
 * Convention: enforce your conventions
    * identify an anti-pattern
    * write a test to catch it
    * whitelist counterexamples
    * reduce the list over time
    * examples
       * don't use `__container__`
       * don't save off `this._super`
       * don't use `$.getJSON` directly
       * always write ES6 modules
    * sometimes you need to use an anti-pattern in an isolated case; Convention Tests keep those anti-patterns from spreading
