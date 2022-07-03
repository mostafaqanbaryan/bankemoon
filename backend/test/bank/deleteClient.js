const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, users, banks, sessions, authorization, bankUserIds }) => {
	describe('/DeleteClient', () => {
		it('Delete client W/O Login NotAcceptable', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/clients`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete client when NotMember NotAcceptable', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/clients`)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete client by Self Acceptable', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/clients`)
				.set('user-id', sessions[2].userId)
				.set('authorization', authorization(2))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Delete client by Another NotAcceptable', done => {
			chai.request(server)
				.delete(`/banks/${banks[0].username}/clients/${sessions[3].userId}`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete client by Creator Acceptable', done => {
			chai.request(server)
				// .delete(`/banks/${banks[0].username}/clients/${sessions[3].userId}`)
				.delete(`/banks/${banks[0].username}/clients/${bankUserIds[banks[0].username][sessions[3].userId]}`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Delete NotMember by Creator NotAcceptable', done => {
			chai.request(server)
				// .delete(`/banks/${banks[0].username}/clients/${sessions[7].userId}`)
				.delete(`/banks/${banks[0].username}/clients/56998989`)
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
};

