const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, banks, sessions, authorization }) => {
	describe('/AddBankAdmin ', () => {
		it('Add Admin W/O loggingIn', done => {
			let admin = {
				id: sessions[1].userId
			};
			chai.request(server)
				.post(`/banks/${banks[0].username}/admins/`)
				.send(admin)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add Admin By User-1 Added by Admin', done => {
			let admin = {
				id: sessions[1].userId
			};
			chai.request(server)
				.post(`/banks/${banks[0].username}/admins/`)
				.send(admin)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add Admin By User-4 Accepted', done => {
			let admin = {
				id: sessions[1].userId
			};
			chai.request(server)
				.post(`/banks/${banks[0].username}/admins/`)
				.send(admin)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add Admin By User-5 Declined', done => {
			let admin = {
				id: sessions[1].userId
			};
			chai.request(server)
				.post(`/banks/${banks[0].username}/admins/`)
				.send(admin)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add Admin By User-6 Pending', done => {
			let admin = {
				id: sessions[1].userId
			};
			chai.request(server)
				.post(`/banks/${banks[0].username}/admins/`)
				.send(admin)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add Admin-1 Bank-0 By Creator', done => {
			let admin = {
				id: sessions[1].userId
			};
			chai.request(server)
				.post(`/banks/${banks[0].username}/admins/`)
				.send(admin)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Add Admin-5 Bank-1 By Creator', done => {
			let admin = {
				id: sessions[5].userId
			};
			chai.request(server)
				.post(`/banks/${banks[1].username}/admins/`)
				.send(admin)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Add Duplicate Admin By Creator is Acceptable', done => {
			let admin = {
				id: sessions[1].userId
			};
			chai.request(server)
				.post(`/banks/${banks[0].username}/admins/`)
				.send(admin)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Add Admin-2 By Admin', done => {
			let admin = {
				id: sessions[2].userId
			};
			chai.request(server)
				.post(`/banks/${banks[0].username}/admins/`)
				.send(admin)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});
	});

	describe('/DemoteBankAdmin ', () => {
		it('Demoting Creator to Admin By Self is Not Acceptable', done => {
			let admin = {
				id: sessions[0].userId
			};
			chai.request(server)
				.post(`/banks/${banks[0].username}/admins/`)
				.send(admin)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Demoting Creator to Admin By Admin is Not Acceptable', done => {
			let admin = {
				id: sessions[0].userId
			};
			chai.request(server)
				.post(`/banks/${banks[0].username}/admins/`)
				.send(admin)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/DeleteBankAdmin ', () => {
		it('Delete Creator By Admin should fail', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/admins/${sessions[0].userId}`)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete Admin-2 By Admin should success', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/admins/${sessions[2].userId}`)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});
};
