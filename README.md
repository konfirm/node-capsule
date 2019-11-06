# Capsule

Small container implementation allowing automatic property resolving. This opens up for things like autoloading and configuration sharing.

## Motivation

Before anything else; the Capsule module may prove to be a _bad idea™_.

The main reason to start experimenting with it was to figure out whether the concept of autoloading would be viable compared to elaborate exports and/or `require` (import) of deeply nested files.

Among other possible benefits, the way a Capsule allows for overrides could make some scenario's easier to implement, such as overriding functionality by simply assigning alternative values.

At the core the Capsule is merely a simple [Proxy trap][3]

## Installation

`@konfirm/capsule` is a scoped package, which means the scope must be provided for both installation and usage.

### Using [npm][1]

```
$ npm install --save @konfirm/capsule
```

### Using [yarn][2]

```
$ yarn add @konfirm/capsule
```

## Exports

The Capsule package exports a ready to use class, as well as some components it'll need to operate.

| name                        | purpose                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `*` (default)               | The default export is the Capsule class, but [proxied][3] in order provide a smooth out-of-the-box experience. |
| `Capsule`                   | The real Capsule class (unproxied)                                                                             |
| `Resolver`                  | All of the resolvers provided by the [`Resolver package`][4] as object                                         |
| `Resolver.AbstractResolver` | The [`AbstractResolver`][5], useful for implementing your own Resolvers                                        |
| `Resolver.VirtualResolver`  | The [`VirtualResolver`][7], a very eager Resolver, allowing everything                                         |
| `Resolver.RequireResolver`  | The [`RequireResolver`][8], a Resolver handling directories and every type of file `require` has to offer      |

## Usage

The main Capsule export should suffice for most use-cases, the initial set-up could look like:

```js
const Path = require('path');
const Capsule = require('@konfirm/capsule');
const { VirtualResolver, RequireResolver } = Capsule;
const capsule = new Capsule(
	new RequireResolver(Path.join(__dirname, 'path', 'to', 'files')),
	new VirtualResolver()
);
```

Using this setup, the `capsule` variable will try to resolve any accessed property as directory or file (`RequireResolver`) or as anything else (`VirtualResolver`).

```js
const One = capsule.One; // equivalent to require(`${__dirname}/path/to/files/One.js`);
```

As capsule is an object, it also allows for destructuring.

```js
const { One, Two } = capsule;

// equivalent to
// const One = require(`${__dirname}/path/to/files/One.js`);
// const Two = require(`${__dirname}/path/to/files/Two.js`);
```

This has the potential to make loading files simple (linking in your favorite editor probably not so much).

## API

The main Capsule export is a [Proxy][3] around the actual `Capsule` class. It allows for the addition of the `Capsule` and `Resolver` properties on it as well as providing the means to use a more consice syntax for the common use-case.

```js
const Capsule = require('@konfirm/capsule');
```

### Capsule

While the main export is a [Proxy][3] around the `Capsule` class itself, it can be accesed as property of the main export.

```js
const { Capsule } = require('@konfirm/capsule');
```

or

```js
const Capsule = require('@konfirm/capsule').Capsule;
```

Instances of the `Capsule` class are designed to work as [Proxy handler], for which it will trap the following operations

| trap                   | example                      | purpose                                             |
| ---------------------- | ---------------------------- | --------------------------------------------------- |
| [`has`][10]            | `'key' in capsule`           | trap for the `in` operator                          |
| [`get`][11]            | `capsule.key`                | trap for getting a property value                   |
| [`set`][12]            | `capsule.key = true`         | trap for setting a property value                   |
| [`getPrototypeOf`][13] | `capsule instanceof Capsule` | trap for the \[\[GetPrototypeOf\]\] internal method |

Additionally the `Capsule` provides the `encapsulated` property, which provided a the `Capsule` as Proxied object, thus allowing the traps to be used transparently.

### `has`

Using the `'key' in capsule` syntax, the operation will be trapped by the [`has`][10] method, and it will determine whether the requested key is already available. Any key becomes becomes available if is has been added to the internal list of values, either by getting (implicit) or setting (explicit) the key.

Even if the key would be resolvable, the `in` operation would say no as the Capsule does not know of it yet.

```js
const Capsule = require('@konfirm/capsule');
const { VirtualResolver } = Capsule;
const capsule = new Capsule(new VirtualResolver());

console.log('foo' in capsule); // false
console.log('bar' in capsule.foo); // false
console.log('foo' in capsule); // true, as it was resolved using a getter by stating capsule.foo
```

### `get`

Any use of a property on a capsule will be trapped by the [`get`][11] method, if it has been assigned a value that value will be used. If no value has yet been assigned, Capsule will ask all Resolvers (in order) whether the key can be resolved. The first Resolver capable of resolving the requested property will do so and that value is then assigned for further use internally.

It depends on the Resolver implementation on what the return value will be, for a `VirtualResolver` it will always be a new (proxied) Capsule, while for a `RequireResolver` it depends on whether it resolved a directory (in which case the return value is a new (proxied) Capsule) or a (resolvable) file (in which case the value will be the files' contents).

```js
const Capsule = require('@konfirm/capsule');
const { VirtualResolver } = Capsule;
const capsule = new Capsule(new RequireResolver(`${__dirname}/test/sample`));

const {
	Core: { One, Two }
} = capsule;
// equivalent to
// const One = require(`${__dirname}/test/sample/Core/One.js`);
// const Two = require(`${__dirname}/test/sample/Core/Two.js`);
```

### `set`

Setting a property on a capsule will be trapped by the [`set`][12] method, no matter if it already contained a value it will always be reassigned the provided value.

```js
const Capsule = require('@konfirm/capsule');
const { VirtualResolver } = Capsule;
const capsule = new Capsule(new VirtualResolver());

capsule.foo.bar.baz = 'qux';
capsule.foo = 'bar'; // while the bar.baz = 'qux' will still exist, they've now become unreachable
```

### `getPrototypeOf`

Any means to determine the type of a Capsule instance will be trapped by the [`getPrototypeOf`][13] method, this trap mainly exists to allow for verification whether an instance is actually a Capsule. As the main export also implements this trap, there is not need to explicitly obtain the real Capsule class.

```js
const Capsule = require('@konfirm/capsule');
const { VirtualResolver, Capsule: CapsuleClass } = Capsule;
const capsule = new Capsule(new VirtualResolver());

console.log(capsule.foo.bar instanceof Capsule); //  true
console.log(capsule.foo.bar instanceof CapsuleClass); //  true
```

## License

MIT License Copyright (c) 2019 Rogier Spieker (Konfirm)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[1]: https://www.npmjs.com/get-npm
[2]: https://yarnpkg.com/
[3]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
[4]: https://www.npmjs.com/package/@konfirm/resolver
[5]: https://github.com/konfirm/node-resolver#abstractresolver
[7]: https://github.com/konfirm/node-resolver#virtualresolver
[8]: https://github.com/konfirm/node-resolver#requireresolver
[9]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler
[10]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/has
[11]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/get
[12]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/set
[13]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getPrototypeOf
