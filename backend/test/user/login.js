const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, users, addSession }) => {
	describe('/UserLogin ', () => {
		it('Login W Bad Username', done => {
			const user = {
				phoneNumber: 'wrong',
				password: users[0].password,
			};

			chai.request(server)
				.post('/auth/login')
				.send(user)
				.end((err, res) => {
					res.should.have.status(422);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					res.body.message.should.be.eql('شماره را به صورت صحیح وارد کنید');
					done();
				});
		});

		it('Login W Wrong Username', done => {
			const user = {
				phoneNumber: '09213265895',
				password: users[0].password,
			};

			chai.request(server)
				.post('/auth/login')
				.send(user)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					res.body.message.should.be.eql('اطلاعات حساب کاربری صحیح نیست');
					done();
				});
		});

		it('Login W Wrong Password', done => {
			const user = {
				phoneNumber: users[0].phoneNumber,
				password: 'wrong',
				captchaValue: '232',
				captchaId: 'ssd',
			};

			chai.request(server)
				.post('/auth/login')
				.send(user)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});


		it('Login W good data', done => {
			const user = {
				phoneNumber: users[0].phoneNumber,
				password: users[0].password,
			};

			chai.request(server)
				.post('/auth/login')
				.send(user)
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.have.property('session_id');
					res.body.data.should.have.property('user_id');
					let sessionId = res.body.data.session_id;
					let userId = res.body.data.user_id;
					addSession({ sessionId, userId });
					done();
				});
		});

		for(let i = 1; i < users.length; i++){
			it(`Login User-${i}`, done => {
				const user = {
					phoneNumber: users[i].phoneNumber,
					password: users[i].password,
				};

				chai.request(server)
					.post('/auth/login')
					.send(user)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.be.a('object');
						res.body.status.should.be.eql('success');
						res.body.data.should.have.property('session_id');
						res.body.data.should.have.property('user_id');
						let sessionId = res.body.data.session_id;
						let userId = res.body.data.user_id;
						addSession({ sessionId, userId });
						done();
					});
			});
		}
	});
};
