const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, banks, sessions, authorization }) => {
	describe('/EditBank ', () => {
		it('Edit W/O Login', done => {
			let bank = {
				name: 'ام جدید',
				description: 'توضیحات',
				rules: 'قوانین',
				shaba: 'shaba',
				owner: 'owner',
			};
			chai.request(server)
				.patch(`/banks/${banks[0].username}/`)
				.send(bank)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Edit by User-1 Added by Creator', done => {
			let bank = {
				name: 'ام جدید',
				description: 'توضیحات',
				rules: 'قوانین',
				shaba: 'shaba',
				owner: 'owner',
			};
			chai.request(server)
				.patch(`/banks/${banks[0].username}/`)
				.send(bank)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Edit by User-4 W Accepted request', done => {
			let bank = {
				name: 'ام جدید',
				description: 'توضیحات',
				rules: 'قوانین',
				shaba: 'shaba',
				owner: 'owner',
			};
			chai.request(server)
				.patch(`/banks/${banks[0].username}/`)
				.send(bank)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Edit by User-5 W Declined request', done => {
			let bank = {
				name: 'ام جدید',
				description: 'توضیحات',
				rules: 'قوانین',
				shaba: 'shaba',
				owner: 'owner',
			};
			chai.request(server)
				.patch(`/banks/${banks[0].username}/`)
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

		it('Edit by User-6 W Pending request', done => {
			let bank = {
				name: 'ام جدید',
				description: 'توضیحات',
				rules: 'قوانین',
				shaba: 'shaba',
				owner: 'owner',
			};
			chai.request(server)
				.patch(`/banks/${banks[0].username}/`)
				.send(bank)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Edit by User-7 W/O Member', done => {
			let bank = {
				name: 'ام جدید',
				description: 'توضیحات',
				rules: 'قوانین',
				shaba: 'shaba',
				owner: 'owner',
			};
			chai.request(server)
				.patch(`/banks/${banks[0].username}/`)
				.send(bank)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Edit by Creator W Bad name', done => {
			let bank = {
				name: 'bad name',
				description: 'توضیحات',
				rules: 'قوانین',
				shaba: 'shaba',
				owner: 'owner',
			};
			chai.request(server)
				.patch(`/banks/${banks[0].username}/`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(422);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Edit by Creator W Good info', done => {
			let bank = {
				name: 'انک جدید',
				description: 'توضیحات',
				rules: 'قوانین',
				shaba: 'shaba',
				owner: 'owner',
			};
			chai.request(server)
				.patch(`/banks/${banks[0].username}/`)
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

		it('Edit by Admin W Good info', done => {
			let bank = {
				name: 'انک جدید',
				description: 'توضیحات',
				rules: 'قوانین',
				shaba: 'shaba',
				owner: 'owner',
			};
			chai.request(server)
				.patch(`/banks/${banks[0].username}/`)
				.send(bank)
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
};
