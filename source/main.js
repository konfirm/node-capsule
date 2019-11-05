const Capsule = require('./Entity/Capsule.js');
const Resolver = require('@konfirm/resolver');

const exposed = { Capsule, Resolver };

module.exports = new Proxy(Capsule, {
	construct(_, args) {
		const { encapsulated } = new Capsule(...args);

		return encapsulated;
	},
	getPrototypeOf(target) {
		return target.prototype;
	},
	has(target, key) {
		return key in target || key in exposed;
	},
	get(target, key) {
		return key in target ? target[key] : exposed[key];
	}
});
