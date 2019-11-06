const { AbstractResolver } = require('@konfirm/resolver');

const storage = new WeakMap();

/**
 * Small Capsule acting as a trap handler for proxies
 *
 * @class Capsule
 */
class Capsule {
	/**
	 * Creates an instance of Capsule
	 *
	 * @param {*} resolvers
	 * @memberof Capsule
	 */
	constructor(...resolvers) {
		storage.set(this, { resolvers, values: new Map() });
	}

	/**
	 * Trap for the `in` operator
	 *
	 * @param {*} _ (target)
	 * @param {*} key
	 * @returns {boolean} has key
	 * @memberof Capsule
	 */
	has(_, key) {
		const { values } = storage.get(this);

		return values.has(key);
	}

	/**
	 * Trap for getting a property value
	 *
	 * @param {*} _ (target)
	 * @param {*} key
	 * @returns {*} resolved value
	 * @memberof Capsule
	 */
	get(_, key) {
		const { values, resolvers } = storage.get(this);

		// only try to resolve if no key is available
		if (!values.has(key)) {
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

					values.set(key, encapsulated);
				} else {
					values.set(key, resolved);
				}
			}
		}

		return values.get(key);
	}

	/**
	 * Trap for setting a property value
	 *
	 * @param {*} _
	 * @param {*} key
	 * @param {*} value
	 * @memberof Capsule
	 */
	set(_, key, value) {
		const { values } = storage.get(this);

		values.set(key, value);
	}

	/**
	 * Trap for the [[GetPrototypeOf]] internal method
	 *
	 * @returns
	 * @memberof Capsule
	 */
	getPrototypeOf() {
		const {
			constructor: { prototype }
		} = this;

		return prototype;
	}

	/**
	 * Obtain a new Proxy around the current Capsule
	 *
	 * @readonly
	 * @memberof Capsule
	 */
	get encapsulated() {
		return new Proxy({}, this);
	}
}

module.exports = Capsule;
