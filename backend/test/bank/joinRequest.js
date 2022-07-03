const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, users, banks, sessions, authorization }) => {

	describe('/JoinRequestCreation', () => {
		it('JoinRequest by W/O Login', done => {
			chai.request(server)
				.post(`/banks/${banks[0].username}/clients`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('JoinRequest by User-4 with wrong sessionId', done => {
			chai.request(server)
				.post(`/banks/Non-Exists/clients`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization('wrong'))
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('JoinRequest by User-4 to NonExist bank', done => {
			chai.request(server)
				.post(`/banks/Non-Exists/clients`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it(`JoinRequest by User-4`, done => {
				chai.request(server)
					.post(`/banks/${banks[0].username}/clients`)
					.set('user-id', sessions[4].userId)
					.set('authorization', authorization(4))
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.be.a('object');
						res.body.status.should.be.eql('success');
						done();
					});
		});

		it(`JoinRequest by User-5`, done => {
				chai.request(server)
					.post(`/banks/${banks[0].username}/clients`)
					.set('user-id', sessions[5].userId)
					.set('authorization', authorization(5))
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.be.a('object');
						res.body.status.should.be.eql('success');
						done();
					});
		});

		it(`JoinRequest by User-6`, done => {
				chai.request(server)
					.post(`/banks/${banks[0].username}/clients`)
					.set('user-id', sessions[6].userId)
					.set('authorization', authorization(6))
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.be.a('object');
						res.body.status.should.be.eql('success');
						done();
					});
		});
	});

	describe('/JoinRequestManagement', () => {
		let requestId4 = 0, requestId5 = 0;

		it('Get JoinRequests By Creator', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/pending`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.have.keys(['users', 'user_count']);
					res.body.data.users.should.be.a('array');
					res.body.data.users.length.should.be.eql(3);
					requestId4 = res.body.data.users.filter(r => r.phone === users[4].phoneNumber)[0].id;
					requestId5 = res.body.data.users.filter(r => r.phone === users[5].phoneNumber)[0].id;
					done();
				});
		});


		it('Accept JoinRequest for User-4 By User-6', done => {
			chai.request(server)
				.post(`/banks/${banks[0].username}/clients/${requestId4}`)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Accept JoinRequest for User-4 By Client-1', done => {
			chai.request(server)
				.post(`/banks/${banks[0].username}/clients/${requestId4}`)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Accept JoinRequest for User-4 By Creator', done => {
			chai.request(server)
				.post(`/banks/${banks[0].username}/clients/${requestId4}`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		/* it('Accept Duplicate JoinRequest for User-4 By Creator', done => {
			chai.request(server)
				.post(`/banks/${banks[0].username}/clients/${requestId4}`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		}); */

		it('Accept NonExist JoinRequest', done => {
			chai.request(server)
				.post(`/banks/${banks[0].username}/clients/999999`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});


		it('Decline JoinRequest for User-5 By User-6', done => {
			chai.request(server)
				.patch(`/banks/${banks[0].username}/clients/${requestId5}`)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Decline JoinRequest for User-5 By Client-1', done => {
			chai.request(server)
				.patch(`/banks/${banks[0].username}/clients/${requestId5}`)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Decline JoinRequest for User-5 By Creator', done => {
			chai.request(server)
				.patch(`/banks/${banks[0].username}/clients/${requestId5}`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Decline Duplicate JoinRequest for User-5 By Creator is acceptable', done => {
			chai.request(server)
				.patch(`/banks/${banks[0].username}/clients/${requestId5}`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Decline NonExist JoinRequest', done => {
			chai.request(server)
				.patch(`/banks/${banks[0].username}/clients/999999`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/JoinRequestGet', () => {
		it('Get JoinRequests W/O Login', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/pending`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Get JoinRequests By User-7 W/O request', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/pending`)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Get JoinRequests By User-4 W accepted request', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/pending`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Get JoinRequests By User-5 W declined request', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/pending`)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Get JoinRequests By User-6 W pending request', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/pending`)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/JoinRequestDuplicate', () => {
		it(`JoinRequest by User-4 After Accepted`, done => {
				chai.request(server)
					.post(`/banks/${banks[0].username}/clients`)
					.set('user-id', sessions[4].userId)
					.set('authorization', authorization(4))
					.end((err, res) => {
						res.should.have.status(409);
						res.body.should.be.a('object');
						res.body.status.should.be.eql('fail');
						done();
					});
		});

		it(`JoinRequest by User-5 After Declined`, done => {
				chai.request(server)
					.post(`/banks/${banks[0].username}/clients`)
					.set('user-id', sessions[5].userId)
					.set('authorization', authorization(5))
					.end((err, res) => {
						res.should.have.status(409);
						res.body.should.be.a('object');
						res.body.status.should.be.eql('fail');
						done();
					});
		});

		it(`JoinRequest by User-6 After Pending`, done => {
				chai.request(server)
					.post(`/banks/${banks[0].username}/clients`)
					.set('user-id', sessions[6].userId)
					.set('authorization', authorization(6))
					.end((err, res) => {
						res.should.have.status(409);
						res.body.should.be.a('object');
						res.body.status.should.be.eql('fail');
						done();
					});
		});
	});
};
