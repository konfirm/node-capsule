const { AbstractResolver } = require('@konfirm/resolver');

const storage = new WeakMap();

class Capsule {
	constructor(...resolvers) {
		storage.set(this, { resolvers, cache: new Map() });
	}

	has(_, key) {
		const { cache } = storage.get(this);

		return cache.has(key);
	}

	get(_, key) {
		const { cache, resolvers } = storage.get(this);

		if (!cache.has(key)) {
			const [found, ...matches] = resolvers
				.map((resolver) => ({
					resolver,
					match: resolver.match(key)
				}))
				.filter(({ match }) => match);

			if (found) {
				const { resolver, match } = found;
				const resolved = resolver.use(match);

				if (resolved instanceof AbstractResolver) {
					const { constructor: Ctor } = this;
					const { encapsulated } = new Ctor(
						...[resolved].concat(
							matches.map(({ resolver, match }) =>
								resolver.use(match)
							)
						)
					);

					cache.set(key, encapsulated);
				} else {
					cache.set(key, resolved);
				}
			}
		}

		return cache.get(key);
	}

	set(_, key, value) {
		const { cache } = storage.get(this);

		cache.set(key, value);
	}

	getPrototypeOf() {
		return this.constructor.prototype;
	}

	get encapsulated() {
		return new Proxy({}, this);
	}
}

module.exports = Capsule;
