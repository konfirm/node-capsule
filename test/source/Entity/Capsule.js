/* global source, describe, it, each, expect */

const Path = require('path');
const {
	Capsule,
	Resolver: { VirtualResolver, RequireResolver }
} = source('main');

describe('Entity/Capsule', () => {
	it('is a function', (next) => {
		expect(Capsule).to.be.function();

		next();
	});

	it('allows construction', (next) => {
		expect(new Capsule()).to.be.instanceOf(Capsule);

		next();
	});

	describe('Types', () => {
		const { encapsulated: capsule } = new Capsule(new VirtualResolver());

		each`
			type            | value
			----------------|-------
			integer         | ${123}
			float           | ${Math.PI}
			Infinity        | ${Infinity}
			boolean (true)  | ${true}
			boolean (false) | ${false}
			null            | ${null}
			undefined       | ${undefined}
		`('handles $type', ({ type, value }, next) => {
			expect(value in capsule).to.be.false();
			expect(capsule[value]).to.be.instanceOf(Capsule);
			expect(value in capsule).to.be.true();

			capsule[value] = () => `hello ${type}`;

			expect(value in capsule).to.be.true();
			expect(capsule[value]).to.be.function();
			expect(capsule[value]()).to.equal(`hello ${type}`);

			next();
		});
	});

	describe('Virtual resolver', () => {
		const { encapsulated: capsule } = new Capsule(new VirtualResolver());

		it('does not contain unaccessed keys', (next) => {
			expect('foo' in capsule).to.be.false();
			expect('bar' in capsule.foo).to.be.false();
			expect('baz' in capsule.foo.bar).to.be.false();

			next();
		});

		it('resolves every key', (next) => {
			expect(capsule).to.be.instanceOf(Capsule);
			expect(capsule.foo).to.be.instanceOf(Capsule);
			expect(capsule.foo.bar).to.be.instanceOf(Capsule);
			expect(capsule.foo.bar.baz).to.be.instanceOf(Capsule);

			next();
		});

		it('contains all accessed keys', (next) => {
			expect('foo' in capsule).to.be.true();
			expect('bar' in capsule.foo).to.be.true();
			expect('baz' in capsule.foo.bar).to.be.true();

			next();
		});

		it('allows for overrides', (next) => {
			capsule.foo.bar = () => 'Hello override';

			expect(capsule.foo.bar).not.to.be.instanceOf(Capsule);
			expect(capsule.foo.bar).to.be.function();
			expect(capsule.foo.bar()).to.be.equal('Hello override');

			next();
		});
	});

	describe('Require resolver', () => {
		const sample = Path.join(__dirname, '..', '..', 'sample');
		const { encapsulated: capsule } = new Capsule(
			new RequireResolver(sample)
		);

		it('does not contain unaccessed keys', (next) => {
			expect('Nope' in capsule).to.be.false();
			expect('Core' in capsule).to.be.false();
			expect('Nested' in capsule.Core).to.be.false();

			next();
		});

		it('handles filesystem capsules', (next) => {
			expect(capsule).to.be.instanceOf(Capsule);

			const OneJS = require(Path.join(sample, 'Core', 'One.js'));
			const NestedOneJS = require(Path.join(
				sample,
				'Core',
				'Nested',
				'One.js'
			));

			expect(capsule.Nope).to.be.undefined();

			expect(capsule.Core).to.be.instanceOf(Capsule);
			expect(capsule.Core.Nested).to.be.instanceOf(Capsule);
			expect(capsule.Core.One).to.equal(OneJS);
			expect(capsule.Core.Nested.One).to.equal(NestedOneJS);
			expect(capsule.Core['One.js']).to.equal(OneJS);
			expect(capsule.Core.Nested['One.js']).to.equal(NestedOneJS);

			expect(capsule.Project).to.be.instanceOf(Capsule);
			expect(capsule.Project.Nested).to.be.instanceOf(Capsule);

			next();
		});

		it('contains accessed and available keys', (next) => {
			expect('Nope' in capsule).to.be.false();
			expect('Core' in capsule).to.be.true();
			expect('One' in capsule.Core).to.be.true();
			expect('Nested' in capsule.Core).to.be.true();
			expect('One' in capsule.Core.Nested).to.be.true();

			next();
		});
	});

	describe('Combined resolvers', () => {
		const sample = Path.join(__dirname, '..', '..', 'sample');
		const { encapsulated: capsule } = new Capsule(
			new RequireResolver(sample),
			new VirtualResolver('virtual')
		);

		it('does not contain unaccessed keys', (next) => {
			expect('Nope' in capsule).to.be.false();
			expect('Core' in capsule).to.be.false();
			expect('Nested' in capsule.Core).to.be.false();

			next();
		});

		it('handles filesystem capsules', (next) => {
			expect(capsule).to.be.instanceOf(Capsule);

			const OneJS = require(Path.join(sample, 'Core', 'One.js'));
			const NestedOneJS = require(Path.join(
				sample,
				'Core',
				'Nested',
				'One.js'
			));

			expect(capsule.Nope).to.be.instanceOf(Capsule);

			expect(capsule.Core).to.be.instanceOf(Capsule);

			expect(capsule.Core.Nope).to.be.instanceOf(Capsule);
			expect(capsule.Core.Nested).to.be.instanceOf(Capsule);
			expect(capsule.Core.Nested.Nope).to.be.instanceOf(Capsule);

			expect(capsule.Core.One).to.equal(OneJS);
			expect(capsule.Core.Nested.One).to.equal(NestedOneJS);

			next();
		});

		it('contains all accessed and available keys', (next) => {
			expect('Nope' in capsule).to.be.true();
			expect('Core' in capsule).to.be.true();
			expect('One' in capsule.Core).to.be.true();
			expect('Nested' in capsule.Core).to.be.true();
			expect('One' in capsule.Core.Nested).to.be.true();

			next();
		});
	});
});
