/* global source, describe, it, each, expect */

const Path = require('path');
const Capsule = source('main');

describe('main', () => {
	describe('exports', () => {
		it('identifies as Capsule', (next) => {
			expect(Capsule).to.be.function();
			expect('name' in Capsule).to.be.true();
			expect(Capsule.name).to.equal('Capsule');

			next();
		});

		it('contains the actual Capsule', (next) => {
			expect('Capsule' in Capsule).to.be.true();

			expect(Capsule.Capsule).to.be.function();
			expect('name' in Capsule.Capsule).to.be.true();
			expect(Capsule.Capsule.name).to.equal('Capsule');

			expect(Capsule).not.to.equal(Capsule.Capsule);
			expect(Capsule).not.to.shallow.equal(Capsule.Capsule);

			next();
		});

		describe('Resolvers', () => {
			it('contains Resolvers', (next) => {
				expect('Resolver' in Capsule).to.be.true();
				expect(Capsule.Resolver).to.be.object();
				expect(Capsule.Resolver).to.contain('AbstractResolver');
				expect(Capsule.Resolver).to.contain('VirtualResolver');
				expect(Capsule.Resolver).to.contain('RequireResolver');

				next();
			});

			it('contains AbstractResolver', (next) => {
				expect(Capsule.Resolver).to.contain('AbstractResolver');

				const {
					Resolver: { AbstractResolver }
				} = Capsule;

				expect(AbstractResolver).to.be.function();

				next();
			});

			it('contains VirtualResolver', (next) => {
				expect(Capsule.Resolver).to.contain('VirtualResolver');

				const {
					Resolver: { VirtualResolver }
				} = Capsule;

				expect(VirtualResolver).to.be.function();

				next();
			});

			it('contains RequireResolver', (next) => {
				expect(Capsule.Resolver).to.contain('RequireResolver');

				const {
					Resolver: { RequireResolver }
				} = Capsule;

				expect(RequireResolver).to.be.function();

				next();
			});
		});
	});

	describe('Proxy', () => {
		const {
			Resolver: { VirtualResolver, RequireResolver }
		} = Capsule;
		const sample = Path.join(__dirname, '..', 'sample');
		const instance = new Capsule(
			new RequireResolver(sample),
			new VirtualResolver('virtual')
		);

		it('instance is Capsule', (next) => {
			expect(instance).to.be.instanceOf(Capsule);
			expect(instance).to.be.instanceOf(Capsule.Capsule);

			next();
		});

		it('resolves non-existent paths', (next) => {
			expect(instance.foo.bar).to.be.instanceOf(Capsule);

			next();
		});

		it('resolves real modules', (next) => {
			const OneJS = require(Path.join(sample, 'Core', 'One.js'));
			const TwoJS = require(Path.join(sample, 'Project', 'Two.js'));

			expect(instance.Core.One).to.equal(OneJS);
			expect(instance.Project.Two).to.equal(TwoJS);

			next();
		});
	});
});
