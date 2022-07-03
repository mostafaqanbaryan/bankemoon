const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, users, unregistered, banks, sessions, authorization, bankUserIds }) => {
	describe('/AddClient by Creator', () => {
		it('Add client with USERNAME', done => {
			let bank = {
				key: 'username',
				value: users[1].username,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Add client with USERNAME', done => {
			let bank = {
				key: 'username',
				value: users[2].username,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Add client with PHONE', done => {
			let bank = {
				key: 'phoneNumber',
				value: users[3].phoneNumber,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});
	});

	describe('/AddClient by Unauthorized Users', () => {
		it('Add User-4 by Client-1', done => {
			let bank = {
				key: 'ID',
				value: sessions[4].userId,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add User-4 by User-5', done => {
			let bank = {
				key: 'ID',
				value: sessions[4].userId,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/AddDuplicateClient', () => {
		/* it('Add duplicate client by ID', done => {
			let bank = {
				key: 'ID',
				value: sessions[1].userId,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(409);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		}); */

		it('Add duplicate client by USERNAME', done => {
			let bank = {
				key: 'username',
				value: users[1].username,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(409);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add duplicate client by PHONE', done => {
			let bank = {
				key: 'phoneNumber',
				value: users[1].phoneNumber,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(409);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/AddUnknownClient', () => {
		/* it('Add client by Unknown ID', done => {
			let bank = {
				key: 'ID',
				value: '999999999',
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		}); */

		it('Add client by Unknown UserName', done => {
			let bank = {
				key: 'username',
				value: 'wrong_username',
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add client by Unknown PHONE', done => {
			let bank = {
				key: 'phoneNumber',
				value: '09100000000',
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add client by BAD Key', done => {
			let bank = {
				key: 'wrong',
				value: sessions[1].userId,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(405);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add client by BAD Value', done => {
			let bank = {
				key: 'wrong',
				value: null
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(405);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/AddClient by Creator', () => {
		/* it('Add client with USERNAME', done => {
			let bank = {
				key: 'username',
				value: users[2].username,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Add client with PHONE', done => {
			let bank = {
				key: 'phoneNumber',
				value: users[3].phoneNumber,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		}); */

		it('Add client with USERNAME', done => {
			let bank = {
				key: 'username',
				value: users[5].username,
			};
			chai.request(server)
				.put(`/banks/${banks[1].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});
	});

	describe('/RegisterClient by Creator', () => {
		/* it('Add client with USERNAME', done => {
			let bank = {
				key: 'username',
				value: users[2].username,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Add client with PHONE', done => {
			let bank = {
				key: 'phoneNumber',
				value: users[3].phoneNumber,
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		}); */

		it('Register user and Add them to bank by Creator', done => {
			let user = {
				firstName: unregistered[0].firstName,
				lastName: unregistered[0].lastName,
				phoneNumber: unregistered[0].phoneNumber,
			};
			chai.request(server)
				.put(`/auth/register/${banks[1].username}/`)
				.send(user)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});
	});
};
