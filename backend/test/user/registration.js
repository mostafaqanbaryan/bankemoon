const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, users }) => {
	describe('/UserRegistration', () => {
		it('Register W bad fullName', done => {
			const user = {
				firstName: 'test',
				lastName: 'test',
				phoneNumber: users[0].phoneNumber,
				userName: users[0].username,
				captchaValue: '232',
				captchaId: 'ssd',
			};

			chai.request(server)
				.post('/auth/register')
				.send(user)
				.end((err, res) => {
					res.should.have.status(422);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Register W bad phoneNumber', done => {
			const user = {
				firstName: users[0].firstName,
				lastName: users[0].lastName,
				phoneNumber: '45656532148',
				userName: users[0].username,
				captchaValue: '232',
				captchaId: 'ssd',
			};

			chai.request(server)
				.post('/auth/register')
				.send(user)
				.end((err, res) => {
					res.should.have.status(422);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Register W bad username', done => {
			const user = {
				firstName: users[0].firstName,
				lastName: users[0].lastName,
				phoneNumber: users[0].phoneNumber,
				userName: 'شسیشسیa;sdl',
				captchaValue: '232',
				captchaId: 'ssd',
			};

			chai.request(server)
				.post('/auth/register')
				.send(user)
				.end((err, res) => {
					res.should.have.status(422);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Register with good data', done => {
			const user = {
				firstName: users[0].firstName,
				lastName: users[0].lastName,
				phoneNumber: users[0].phoneNumber,
				userName: users[0].username,
			};

			chai.request(server)
				.post('/auth/register')
				.send(user)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Register with duplicate username', done => {
			const user = {
				firstName: users[0].firstName,
				lastName: users[0].lastName,
				phoneNumber: users[1].phoneNumber,
				userName: users[0].username,
			};

			chai.request(server)
				.post('/auth/register')
				.send(user)
				.end((err, res) => {
					res.should.have.status(409);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Register with duplicate phone', done => {
			const user = {
				firstName: users[0].firstName,
				lastName: users[0].lastName,
				phoneNumber: users[0].phoneNumber,
				userName: users[1].username,
			};

			chai.request(server)
				.post('/auth/register')
				.send(user)
				.end((err, res) => {
					res.should.have.status(409);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		for(let i = 1; i < users.length; i++){
			it(`Register User-${i}`, done => {
				const user = {
					firstName: users[i].firstName,
					lastName: users[i].lastName,
					phoneNumber: users[i].phoneNumber,
					userName: users[i].username,
				};

				chai.request(server)
					.post('/auth/register')
					.send(user)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.be.a('object');
						res.body.status.should.be.eql('success');
						done();
					});
			});
		}
	});
};
