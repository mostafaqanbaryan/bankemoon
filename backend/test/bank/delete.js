const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, banks, sessions, authorization }) => {
	describe('/DeleteBank ', () => {
		it('Delete W/O Login', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by User-1 Added by Creator', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by User-4 W Accepted request', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by User-5 W Declined request', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/`)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by User-6 W Pending request', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/`)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by User-7 W/O Member', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/`)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by Admin is forbidden', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/`)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete NonExist Bank should be forbidden', done => {
			chai.request(server)
				.delete(`/banks/WRONG/`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete Bank-2 by Creator-6', done => {
			chai.request(server)
				.delete(`/banks/${banks[2].username}/`)
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


	// Level 3
	// Total
	// Deleted bank-2
	// Deleted user-2
	//
	// Bank-0
	// Total from edit.js => 1001464999 - 30000 = 1001434999
	//
	//
	// Bank-1
	// Payments: balance-5
	//
};

