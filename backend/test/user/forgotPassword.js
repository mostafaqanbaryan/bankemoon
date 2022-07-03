const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, users }) => {
	describe('/UserForgotPassword ', () => {
		it('ForgotPassword Wrong PhoneNumber', done => {
			const user = {
				phoneNumber: '09000000000',
			};

			chai.request(server)
				.post('/auth/forgot-password')
				.send(user)
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					res.body.message.should.be.eql('کاربر وجود ندارد');
					done();
				});
		});

		it('ForgotPassword Good PhoneNumber', done => {
			const user = {
				phoneNumber: users[0].phoneNumber,
			};

			chai.request(server)
				.post('/auth/forgot-password')
				.send(user)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});
	});
};
