/* global source, describe, it, each, expect */

const Path = require('path');
const Capsule = source('main');
const {
	Resolver: { VirtualResolver, RequireResolver }
} = Capsule;

describe('cases/allocation', () => {
	const sample = Path.join(__dirname, '..', '..', 'sample');
	const capsule = new Capsule(new VirtualResolver('virtual'));

	it('allows for allocation', (next) => {
		capsule.core = new Capsule(
			new RequireResolver(Path.join(sample, 'Core'))
		);
		capsule.alias.core = capsule.core;
		capsule.alias.nested.core = new Capsule(
			new RequireResolver(Path.join(sample, 'Core'))
		);

		expect('One' in capsule.core).to.be.false();
		expect(capsule.core.One).to.be.string();
		expect(capsule.core.One).to.equal('Core/One');
		expect('One' in capsule.core).to.be.true();

		expect('One' in capsule.alias.core).to.be.true();
		expect(capsule.alias.core.One).to.be.string();
		expect(capsule.alias.core.One).to.equal('Core/One');
		expect('One' in capsule.alias.core).to.be.true();

		expect('One' in capsule.alias.nested.core).to.be.false();
		expect(capsule.alias.nested.core.One).to.be.string();
		expect(capsule.alias.nested.core.One).to.equal('Core/One');
		expect('One' in capsule.alias.nested.core).to.be.true();

		expect(capsule.core.One).to.shallow.equal(capsule.alias.core.One);
		expect(capsule.core.One).to.shallow.equal(
			capsule.alias.nested.core.One
		);

		next();
	});
});
