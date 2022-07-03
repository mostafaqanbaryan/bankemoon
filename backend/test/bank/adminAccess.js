const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, banks, sessions, authorization }) => {
	describe('/BankAdminAccess ', () => {
		it('Access BankRequests W/O Login', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/pending`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					res.body.message.should.be.eql('ابتدا وارد شوید');
					done();
				});
		});

		/* it('Access BankRequests W User-6 Added By Creator', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/pending`)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					res.body.message.should.be.eql('ابتدا وارد شوید');
					done();
				});
		}); */

		it('Access BankRequests W User-4 W accepted JoinRequest', done => {
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

		it('Access BankRequests W User-5 W declined JoinRequest', done => {
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

		it('Access BankRequests W User-6 W pending JoinRequest', done => {
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

		it('Access BankRequests W Creator', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/pending`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					// res.body.data.users.should.be('array');
					res.body.data.users.length.should.be.eql(1);
					done();
				});
		});

		it('Access BankRequests W Admin', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/pending`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					// res.body.data.users.should.be('array');
					res.body.data.users.length.should.be.eql(1);
					done();
				});
		});
	});
};
