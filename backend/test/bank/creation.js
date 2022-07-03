const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, banks, sessions, authorization }) => {
	describe('/BankCreation ', () => {
		it('Create W/O Login', done => {
			let bank = {
				name: banks[0].name,
				username: banks[0].username
			};
			chai.request(server)
				.post('/banks')
				.send(bank)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					res.body.message.should.be.eql('ابتدا وارد شوید');
					done();
				});
		});

		it('Create W/ bad name', done => {
			let bank = {
				name: 'wrong',
				username: banks[0].username,
			};
			chai.request(server)
				.post('/banks')
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

		it('Create W/ bad username', done => {
			let bank = {
				name: banks[0].name,
				username: 'یوزرنیم',
			};
			chai.request(server)
				.post('/banks')
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

		it('Create Bank-0 W/ good data W/ Initial value', done => {
			let bank = {
				name: banks[0].name,
				username: banks[0].username,
				initial: 500000,
			};
			chai.request(server)
				.post('/banks')
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

		it('Create Bank-1 W/ good data W/O Initial value', done => {
			let bank = {
				name: banks[1].name,
				username: banks[1].username,
			};
			chai.request(server)
				.post('/banks')
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

		it('Create Bank-2 W/ good data W/O Initial value', done => {
			let bank = {
				name: banks[2].name,
				username: banks[2].username,
			};
			chai.request(server)
				.post('/banks')
				.send(bank)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Create W/ Duplicate name', done => {
			let bank = {
				name: banks[1].name,
				username: banks[2].username,
				initial: 500000,
			};
			chai.request(server)
				.post('/banks')
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

		it('Create W/ Duplicate username', done => {
			let bank = {
				name: banks[2].name,
				username: banks[1].username,
				initial: 500000,
			};
			chai.request(server)
				.post('/banks')
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
};
