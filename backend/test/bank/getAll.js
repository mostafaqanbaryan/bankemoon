const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, sessions, authorization }) => {
	describe('/BankGetAll ', () => {
		it('Get banks W/O Login', done => {
			chai.request(server)
				.get('/banks')
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					res.body.message.should.be.eql('ابتدا وارد شوید');
					done();
				});
		});

		it('Get banks W Login', done => {
			chai.request(server)
				.get('/banks')
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.banks.should.has.a('array');
					done();
				});
		});
	});
};

