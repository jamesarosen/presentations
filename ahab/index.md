## Problem

### Application Developers

Web application developers do not have a standard way to depend upon front-end assets. Those developing Rails applications prefer the assets be bundled up in Ruby gems, e.g. [bootstrap-sass-rails](https://rubygems.org/gems/bootstrap-sass-rails). Those developing Node.js applications prefer the assets be bundled up as npm modules, e.g. [bootstrap-sass](https://npmjs.org/package/bootstrap-sass). Still others prefer consuming Bower packages, e.g. [bower-bootstrap-less](https://github.com/jozefizso/bower-bootstrap-less). Maven developers have the own packaging system, and so naturally, [Bootstrap-Maven](https://github.com/efsavage/Bootstrap-Maven) exists. Others give up on dependency management of assets altogether and simply copy-and-paste assets into their vendor directory.

### Library Authors

Library authors face a similar struggle. With so many competing packaging systems -- at least one for every language commonly used for web development -- it’s hard to publish libraries for easy consumption. A few brave souls have tried adding Bower or npm support to their libraries themselves, but the norm is to simply produce a single distribution file and expect other developers to create packaged versions for each idiosyncratic packaging system.

## Solution

### Lingua Franca

Where do Rails applications, Node.js, jQuery, Ember, Handlebars, and Twitter-Bootstrap all meet? At the HTTP layer. (Also, to a degree, at the HTML layer; let’s put that aside for now.)

Asset projects like jQuery, Ember, and Twitter-Bootstrap all publish their assets to a CDN. Some of them also make the projects available as Rubygems, npm modules, or bower components, but HTTP GETs are the one constant.

The URL is already the fundamental unit of reuse for front-end assets. ahab rests firmly on this foundation, and hews as closely as possible to HTTP principles for more advanced features.

## Protocol

### Level 0: Glorified cURL

See also [cURL](https://en.wikipedia.org/wiki/CURL).

Many asset projects, like jQuery and Ember, already publish their built files to a CDN. If AHAB is to succeed it must work with these files. Bower does this well, and its behavior is a good starting place.

Given the following ahab.json file

```json
{
  "assets": [
    { "name": "ember": "url": http://builds.emberjs.com/release/ember.js" }
  ]
}
```

running `ahab fetch` will put the contents of `http://builds.emberjs.com/release/ember.js` into `ahab_assets/ember.js`.

At Level 0, the system is essentially a glorified cURL. It gives developers a single file that lists asset dependencies and fetches them automatically. It does not, however provide for automatic fetching of dependencies of dependencies, nor does it help the consumer update dependency versions easily or guard against conflicting version requirements.

### Level 1: Symbolic Lookup

See also RFC [6570, URI Templates](http://tools.ietf.org/html/rfc6570).

Package managers like Rubgems, Bower, and NPM all allow symbolic lookup of packages based on a name and version. In Bower, the syntax is

```json
{
  "assets": [
    { "name": "ember", "version": "1.0.0" }
  ]
}
```

This removes a hurdle for developers as they no longer have to go looking for URLs for each dependency. This feature requires a resolver. This usually takes the form of a central server. Most package managers allow you to specify an ordered list of several such servers.

The simplest thing that could possible work as a registry is a URI template. Given the following ahab.json file,

```json
{
  "registries": [
    "https://cdnjs.cloudflare.com/ajax/libs/{name}/{version}/{name}.js"
  ],

  "assets": [
    { "name": "jquery", "version": "2.0.1" }
  ]
}
```

`ahab fetch` will put the contents of `https://cdnjs.cloudflare.com/ajax/libs/jquery/2.0.1/jquery.js` into `ahab_assets/jquery.js`.

For a registry that exposes a single endpoint with query parameters instead of predictable URLs, use a URI template like `https://myregistry.com/asset?name={name}&version={version}`.

If a package has its own URI scheme, you can either add it to the list of global registries or set the URI template as the package's URL:

```json
{
  "registries": [
    "https://cdnjs.cloudflare.com/ajax/libs/{name}/{version}/{name}.js"
  ],

  "assets": [
      { "name": "jquery", "version": "2.0.1" } // use the cdnjs registry,

      {
        "name": "ember",
        "url": "http://builds.emberjs.com/tags/v{version}/ember.prod.js",
        "version": "1.0.0"
      }
    }
  ]
}
```

### Level 2: Self-Describing Symbolic Lookup

Registries MAY choose to provide a `Link rel="ahab-uri-template"` header. For servers that do, the user may use a simple URL instead of a URI template. Given the following `ahab.json` file

```json
{
  "registries": [
    "https://ahab.io"
  ],

  "assets": [
    { "name": "jquery", "version": "2.0.1" }
  ]
}
```

`ahab fetch` will

 1. determine that the registry URI does not have the required URI template parameters
 1. make an `OPTIONS` request to `https://ahab.io`
 1. look for a `Link rel="http://ahab.io/documentation/x-asset-registry-uri"` header
 * if the header is found, use its content as the registry URI template
 * if the header is not found, print a warning that the registry is incomplete

### Level 3: X-Asset-Dependencies

Not yet documented.

### Level 4: X-Accept-Asset-Version

Not yet documented.
