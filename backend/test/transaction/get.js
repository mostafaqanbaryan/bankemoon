const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const constant = require('../../constant');
chai.use(chaiHttp);

module.exports = ({ db, server, banks, sessions, authorization, addBankUserId }) => {

	describe('/GetTransactions by Creator', () => {
		it('Get ALL Type of Bank-1 by Creator', done => {
			chai.request(server)
				.get(`/transactions/${banks[1].username}/`)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.transactions.should.be.an('array');
					res.body.data.transactions.length.should.be.eql(1);
					done();
				});
		});

		it('Get ALL Type of Bank-0 by Creator', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.transactions.should.be.an('array');
					res.body.data.transactions.length.should.be.eql(7);
					done();
				});
		});

		it('Get Payment Type of Bank-0 by Creator', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/payment`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.transactions.should.be.an('array');
					res.body.data.transactions.length.should.be.eql(4);
					done();
				});
		});

		it('Get Loan Type of Bank-0 by Creator', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/loan`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.transactions.should.be.an('array');
					res.body.data.transactions.length.should.be.eql(2);
					done();
				});
		});

		it('Get Instalment Type of Bank-0 by Creator', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/instalment`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.transactions.should.be.an('array');
					res.body.data.transactions.length.should.be.eql(1);
					done();
				});
		});

		it('Get Initial Type of Bank-0 by Creator', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/initial`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.transactions.should.be.an('array');
					res.body.data.transactions.length.should.be.eql(0);
					done();
				});
		});
	});

	describe('/GetTransactions by random users', () => {
		it('Get ALL Type of Bank-0 by Admin', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/`)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.transactions.should.be.an('array');
					res.body.data.transactions.length.should.be.eql(7);
					done();
				});
		});

		it('Get ALL Type of Bank-0 by Client-3 AS Admin', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/`)
				.set('user-id', sessions[3].userId)
				.set('authorization', authorization(3))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.have.keys('transactions');
					res.body.data.transactions.should.be.an('array');
					res.body.data.transactions.length.should.be.eql(0);
					done();
				});
		});

		it('Get Payment Type of Bank-0 by Declined Client-5 AS Admin', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/payment`)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Get Loan Type of Bank-0 by Pending Client-6 AS Admin', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/loan`)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Get Instalment Type of Bank-0 by NonMember AS Admin', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/instalment`)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Get Initial Type of Bank-0 by noLoggedIn AS Admin', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/initial`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/Get BalanceInfo by random users', () => {
		it('Get BalanceInfo of Bank-0 by Creator', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/info`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.be.an('object');
					res.body.data.should.have.all.keys('balance', 'admins');
					res.body.data.balance.should.have.all.keys(
						constant.banks.LOAN_COUNT,
						constant.banks.TRANSACTION_COUNT,
						constant.banks.COMMISSION_BALANCE,
						constant.banks.BALANCE
					);
					res.body.data.balance[constant.banks.BALANCE].should.be.eql(1001434999);
					res.body.data.balance[constant.banks.TRANSACTION_COUNT].should.be.eql(9);
					res.body.data.balance[constant.banks.LOAN_COUNT].should.be.eql(2);
					done();
				});
		});

		it('Get BalanceInfo of Bank-0 by Client', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/info`)
				.set('user-id', sessions[2].userId)
				.set('authorization', authorization(2))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.be.an('object');
					res.body.data.balance.should.have.all.keys(
						constant.banks.LOAN_COUNT,
						constant.banks.TRANSACTION_COUNT,
						constant.banks.COMMISSION_BALANCE,
						constant.banks.BALANCE
					);
					done();
				});
		});

		it('Get BalanceInfo of Bank-0 by Declined Client-5', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/balance`)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Get BalanceInfo of Bank-0 by Pending Client-6', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/balance`)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Get BalanceInfo of Bank-0 by NotMember Client-7', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/balance`)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Get BalanceInfo of Bank-0 by noLoggedIn', done => {
			chai.request(server)
				.get(`/transactions/${banks[0].username}/balance`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/Get TransactionCount for random user', () => {
		it('Get Bank-0 by Creator', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/info`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.be.an('object');
					res.body.data.should.have.all.keys('balance', 'admins');
					res.body.data.balance.should.have.all.keys(
						constant.banks.LOAN_COUNT,
						constant.banks.TRANSACTION_COUNT,
						constant.banks.COMMISSION_BALANCE,
						constant.banks.BALANCE
					);
					res.body.data.balance[constant.banks.BALANCE].should.be.eql(1001434999);
					res.body.data.balance[constant.banks.TRANSACTION_COUNT].should.be.eql(9);
					res.body.data.balance[constant.banks.LOAN_COUNT].should.be.eql(2);
					done();
				});
		});
	});

	describe('/Get UserBalance for random user After DELETING bank', () => {
	});
};


