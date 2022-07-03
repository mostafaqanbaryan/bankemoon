const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const constant = require('../../constant');
chai.use(chaiHttp);

module.exports = ({ db, users, server, banks, sessions, authorization, addBankUserId, bankUserIds }) => {
	let loanId = 0;
	let loanId4 = 0;
	describe('/CreateTransaction By Creator', () => {
		before(done => {
			db.getClient((err, client) => {
				if(err)
					console.error(err);
				let query =
				`SELECT BU.*,
					BANKS.username
					FROM ${constant.tables.BANKSUSERS} AS BU
				INNER JOIN ${constant.tables.BANKS} AS BANKS
					ON BU.bank_id = BANKS.id`;
				return client.query(query)
					.then(result => result.rows)
					.then(rows => rows.forEach(row => addBankUserId(row.username, row.user_id, row.id)))
					/* .then(() => console.log('AAAAAAAAAAAAAAAAAAAAAa',
						bankUserIds[banks[0].username][sessions[0].userId],
						bankUserIds[banks[0].username][sessions[1].userId],
						bankUserIds[banks[0].username][sessions[2].userId],
						bankUserIds[banks[0].username][sessions[3].userId],
						bankUserIds[banks[0].username][sessions[4].userId],
						bankUserIds[banks[0].username][sessions[5].userId],
						bankUserIds[banks[0].username][sessions[6].userId]
					)) */
					.then(() => client.release())
					.then(() => done());
			});
		});

		it('Create NoType by Creator', done => {
			const transaction = {
				ids: JSON.stringify({persons: [bankUserIds[banks[0].username][sessions[0].userId]]}),
				value: users[0].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404); //Route doesnt exists
					done();
				});
		});

		it('Create NoID by Creator', done => {
			const transaction = {
				value: users[0].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404); //Route doesnt exists
					done();
				});
		});

		it('Create Bad ObjectId by Creator', done => {
			const transaction = {
				ids: JSON.stringify({wrong: [bankUserIds[banks[0].username][sessions[0].userId]]}),
				value: users[0].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404); //Route doesnt exists
					done();
				});
		});

		it('Create WrongType by Creator', done => {
			const transaction = {
				ids: JSON.stringify({persons: [bankUserIds[banks[0].username][sessions[0].userId]]}),
				value: users[0].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/wrong`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(422);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create Payment W/O Value by Creator', done => {
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(422);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create Payment W Wrong Value by Creator', done => {
			const transaction = {
				ids: JSON.stringify({persons: [bankUserIds[banks[0].username][sessions[0].userId]]}),
				value: 'wrong'
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(422);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create Payment W Wrong ID by Creator', done => {
			const transaction = {
				ids: JSON.stringify({persons: [-1]}),
				value: users[0].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create Payment W MAX data by Creator', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[0].userId]}),
				value: 999999999.0
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Create Payment W BIG data by Creator', done => { // 999999999
			const transaction = {
				ids: JSON.stringify({persons: [sessions[0].userId]}),
				value: 9999999999
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(422);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create Payment by Creator', done => { // balance-0
			const transaction = {
				ids: JSON.stringify({persons: [sessions[0].userId]}),
				value: users[0].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Create Loan for Creator by Creator', done => { // -balance-0
			const transaction = {
				ids: JSON.stringify({persons: [sessions[0].userId]}),
				value: -users[0].balance,
				duration: 10,
				commission: 4
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/loan`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					loanId = res.body.data.transaction.id;
					done();
				});
		});

		it('Create Loan for User-4 by Creator', done => { // -balance-4
			const transaction = {
				ids: JSON.stringify({persons: [sessions[4].userId]}),
				value: -users[4].balance,
				duration: 12,
				profit: 12
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/loan`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					console.log(res.body.data);
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					loanId4 = res.body.data.transaction.id;
					done();
				});
		});
	});


	describe('/CreateTransaction For others By Admin', () => {
		it('Create transaction for Accepted client by Admin', done => { // balance-4
			const transaction = {
				ids: JSON.stringify({persons: [sessions[4].userId]}),
				value: users[4].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Create transaction for Declined client by Admin', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[5].userId]}),
				value: users[5].balance,
			};
			console.log(transaction);
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create transaction for Pending client by Admin', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[6].userId]}),
				value: users[6].balance,
			};
			console.log(transaction);
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});


	describe('/CreateTransaction By others AS Admin', () => {
		it('Create Instalment for DontHaveLoan client by Creator', done => {
			const transaction = {
				id: sessions[3].userId,
				value: users[3].balance
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/loan/${loanId4}/instalment`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create Instalment for Accepted client by Accepted AS Admin', done => {
			const transaction = {
				id: sessions[4].userId,
				value: users[4].balance
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/loan/${loanId4}/commission`)
				.send(transaction)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create transaction for Accepted client by Accepted AS Admin', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[4].userId]}),
				value: users[4].balance
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create transaction for Declined client by Declined AS Admin', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[5].userId]}),
				value: users[5].balance
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create transaction for Pending client by Pending AS Admin', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[6].userId]}),
				value: users[6].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});


		it('Create transaction for Another by Accepted AS Admin', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[2].userId]}),
				value: users[2].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create transaction for Another by Declined AS Admin', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[2].userId]}),
				value: users[2].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create transaction for Another by Pending AS Admin', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[2].userId]}),
				value: users[2].balance,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});


	describe('/CreateTransaction AS self', () => {
		it('Create Instalment by Creator is succeed', done => { // balance-0
			const transaction = {
				id: sessions[0].userId,
				value: users[0].balance,
				description: 'اولین قسط وام',
				status: constant.status.ACCEPTED,
			};
			chai.request(server)
				.put(`/transactions/${banks[0].username}/loan/${loanId}/instalment`)
				.send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					console.log(res.body);
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Create Instalment by Accepted client-4 for Creator loan is failed', done => {
			const transaction = {
				value: users[4].balance,
			};
			chai.request(server)
				.post(`/transactions/${banks[0].username}/loan/${loanId}/instalment`)
				.send(transaction)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create Instalment by Accepted client-4 is success', done => {  // balance-4
			const transaction = {
				value: users[4].balance,
			};
			chai.request(server)
				.post(`/transactions/${banks[0].username}/loan/${loanId4}/commission`)
				.send(transaction)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Create transaction by Accepted client-4 is success', done => {  // balance-4
			const transaction = {
				ids: JSON.stringify({persons: [sessions[4].userId]}),
				value: users[4].balance,
			};
			chai.request(server)
				.post(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Create transaction by Declined client-5', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[5].userId]}),
				value: users[5].balance,
			};
			chai.request(server)
				.post(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create transaction by Pending client-6', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[6].userId]}),
				value: users[6].balance,
			};
			chai.request(server)
				.post(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create transaction by client-4 for Accepted is success', done => {  // balance-4
			const transaction = {
				ids: JSON.stringify({persons: [sessions[2].userId]}),
				value: users[2].balance,
			};
			chai.request(server)
				.post(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Create transaction by client-4 for Declined-5 is fail', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[5].userId]}),
				value: users[4].balance,
			};
			chai.request(server)
				.post(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Create transaction by client-4 for Pending-6 is fail', done => {
			const transaction = {
				ids: JSON.stringify({persons: [sessions[6].userId]}),
				value: users[4].balance,
			};
			chai.request(server)
				.post(`/transactions/${banks[0].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/CreateTransaction for other banks', () => {
		it('Create Bank-1 transaction by Admin client-5 is success', done => { // balance-5
			const transaction = {
				ids: JSON.stringify({persons: [sessions[5].userId]}),
				value: users[5].balance,
			};
			chai.request(server)
				.post(`/transactions/${banks[1].username}/payment`)
				.send(transaction)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});

		it('Create Bank-2 transaction by Admin client-6 is success', done => { // balance-6
			const transaction = {
				ids: JSON.stringify({persons: [sessions[6].userId]}),
				value: users[6].balance,
				duration: 10
			};
			chai.request(server)
				.post(`/transactions/${banks[2].username}/loan`)
				.send(transaction)
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

	// Level 1
	// Total: 1000639999
	// Bank-0
	// Payments: 999999999-0 + balance-0 + balance-4 + balance-4 + balance-2 = 1000139999
	// Payments: 999999999 + 10000 + 50000 + 50000 + 50000 = 1000139999
	// Loans: -balance-0 -balance-4 = -60000
	// Instalments: balance-0 + balance-4 =60000
	// Initials: 500000-0
	//
	//
	// Bank-1
	// Payments: balance-5 = 60000
	//
	//
	// Bank-2
	// Loan: balance-6 = -70000
};

