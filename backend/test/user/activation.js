const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

// Models
const User = require('../../Models/user');

module.exports = ({ server, db, users }) => {
	describe('/UserActivation', () => {
		it('Active account W bad phone', done => {
			const user = {
				phoneNumber: '09000000000',
				code: '123311',
				password: users[0].password,
			};

			chai.request(server)
				.post('/auth/reset-password')
				.send(user)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Active account W short code', done => {
			const user = {
				phoneNumber: users[0].phoneNumber,
				code: '1233',
				password: users[0].password,
				captchaValue: '232',
				captchaId: 'ssd',
			};

			chai.request(server)
				.post('/auth/reset-password')
				.send(user)
				.end((err, res) => {
					res.should.have.status(406);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Active account W bad code', done => {
			const user = {
				phoneNumber: users[0].phoneNumber,
				code: '123322',
				password: users[0].password,
			};

			chai.request(server)
				.post('/auth/reset-password')
				.send(user)
				.end((err, res) => {
					res.should.have.status(410);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Active account W bad code', done => {
			const user = {
				phoneNumber: users[0].phoneNumber,
				code: '123322',
				password: users[0].password,
			};

			chai.request(server)
				.post('/auth/reset-password')
				.send(user)
				.end((err, res) => {
					res.should.have.status(410);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Active account W good data', done => {
			db.getClient((err, client) => {
				User.getByUsername(client, users[0].username)
				.then(user => User.getOption(client, user.id, 'activation-code'))
				.then(code => {
					const user = {
						phoneNumber: users[0].phoneNumber,
						code,
						password: users[0].password,
					};

					chai.request(server)
						.post('/auth/reset-password')
						.send(user)
						.end((err, res) => {
							res.should.have.status(200);
							res.body.should.be.a('object');
							res.body.status.should.be.eql('success');
							done();
						});
				})
				.then(() => client.release());
			});
		});

		for(let i = 1; i < users.length; i++){
			it(`Active User-${i}`, done => {
				db.getClient((err, client) => {
					User.getByUsername(client, users[i].username)
					.then(user => User.getOption(client, user.id, 'activation-code'))
					.then(code => {
						const user = {
							phoneNumber: users[i].phoneNumber,
							code,
							password: users[i].password,
						};

						chai.request(server)
							.post('/auth/reset-password')
							.send(user)
							.end((err, res) => {
								res.should.have.status(200);
								res.body.should.be.a('object');
								res.body.status.should.be.eql('success');
								done();
							});
					})
					.then(() => client.release());
				});
			});
		}
	});
};

