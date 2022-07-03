const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const constant = require('../../constant');
const Transaction = require('../../Models/transaction');
chai.use(chaiHttp);

module.exports = ({ db, server, users, banks, sessions, authorization, bankUserIds }) => {
	let transactionId = 0;
	let transactionOldId = 0;
	let updatedValue = 800000;
	let beginBalance = {};

	/* describe('/EditTransaction W/ bad data', () => {
		it('Update W/O data by Creator', done => {
			chai.request(server)
				.patch(`/transactions/${banks[0].username}/${transactionId}`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(422);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Update W/O correct value by Creator', done => {
			const transaction = {
				type: constant.transactions.LOAN,
				value: 800000011000,
				status: constant.status.PENDING,
			};
			chai.request(server)
				.patch(`/transactions/${banks[0].username}/${transactionId}`)
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

		it('Update W/O correct status by Creator', done => {
			const transaction = {
				type: constant.transactions.LOAN,
				value: updatedValue,
				status: 'WRONG',
			};
			chai.request(server)
				.patch(`/transactions/${banks[0].username}/${transactionId}`)
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
	}); */

	describe('/EditTransaction W/ random users', () => {
		before(done => {
			let query = `SELECT id FROM ${constant.tables.BANKS} ORDER BY id ASC LIMIT 1 OFFSET 1;`;
			db.getClient((err, client) => {
				let bankId = 0;
				return client.query(query)
				.then(result => bankId = result.rows[0].id)
				.then(() => Transaction.getBalance(client, bankId))
				.then(balance => beginBalance = balance)
				.then(() => Transaction.getAll(client, bankId, {userId: sessions[0].userId} )) // user-0
				.then(transactions => users[0].transactions = transactions)

				.then(() => Transaction.getAll(client, bankId, {userId: sessions[1].userId} )) // user-1
				.then(transactions => users[1].transactions = transactions)

				.then(() => Transaction.getAll(client, bankId, {userId: sessions[2].userId} )) // user-2
				.then(transactions => users[2].transactions = transactions)

				.then(() => Transaction.getAll(client, bankId, {userId: sessions[3].userId} )) // user-3
				.then(transactions => users[3].transactions = transactions)

				.then(() => Transaction.getAll(client, bankId, {userId: sessions[4].userId} )) // user-4
				.then(transactions => users[4].transactions = transactions)

				.then(() => Transaction.getAll(client, bankId, {userId: sessions[5].userId} )) // user-5
				.then(transactions => users[5].transactions = transactions)

				.then(() => Transaction.getAll(client, bankId, {userId: sessions[6].userId} )) // user-6
				.then(transactions => users[6].transactions = transactions)

				.then(() => Transaction.getAll(client, bankId, {userId: sessions[7].userId} )) // user-7
				.then(transactions => users[7].transactions = transactions)

				.then(() => transactionId = users[0].transactions[2].id)
				.then(() => client.release())

				/* .then(() => console.log('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'))
				.then(() => console.log(users[0].transactions))
				.then(() => console.log(users[1].transactions))
				.then(() => console.log(users[2].transactions))
				.then(() => console.log(users[3].transactions))
				.then(() => console.log(users[4].transactions))
				.then(() => console.log(users[5].transactions))
				.then(() => console.log(users[6].transactions))
				.then(() => console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')) */
				.then(() => done());
			});
		});

		it('Update by NoLoggedIn', done => {
			const transaction = {
				type: constant.transactions.LOAN,
				value: updatedValue,
				status: constant.status.PENDING,
			};
			chai.request(server)
				.patch(`/transactions/${banks[0].username}/${transactionId}`)
				.send(transaction)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Update by NotMember User-7', done => {
			const transaction = {
				type: constant.transactions.LOAN,
				value: updatedValue,
				status: constant.status.PENDING,
			};
			chai.request(server)
				.patch(`/transactions/${banks[0].username}/${transactionId}`)
				.send(transaction)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Update by Accepted User-4', done => {
			const transaction = {
				type: constant.transactions.LOAN,
				value: updatedValue,
				status: constant.status.PENDING,
			};
			chai.request(server)
				.patch(`/transactions/${banks[0].username}/${transactionId}`)
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

		it('Update by Decliend User-5', done => {
			const transaction = {
				type: constant.transactions.LOAN,
				value: updatedValue,
				status: constant.status.PENDING,
			};
			chai.request(server)
				.patch(`/transactions/${banks[0].username}/${transactionId}`)
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

		it('Update by Pending User-6', done => {
			const transaction = {
				type: constant.transactions.LOAN,
				value: updatedValue,
				status: constant.status.PENDING,
			};
			chai.request(server)
				.patch(`/transactions/${banks[0].username}/${transactionId}`)
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

	describe('/EditTransaction', () => {
		it('Update OLD transaction by Creator should fail', done => { // 1 Week max
			db.getClient((err, client) => {
				let query = `INSERT INTO ${constant.tables.TRANSACTIONS}(created_at, bank_user_id, value, creator_id, type, status)
				values((NOW() - INTERVAL '1 WEEK'), $1, 875000, $2, (
					SELECT id from ${constant.tables.TYPES} WHERE label='${constant.transactions.PAYMENT}' LIMIT 1
				), (
					SELECT id from ${constant.tables.STATUS} WHERE label='${constant.status.ACCEPTED}' LIMIT 1
				));`;
				client.query(query, [bankUserIds[banks[0].username][sessions[0].userId], sessions[0].userId])
					.then(() => client.query(`SELECT currval('${constant.tables.TRANSACTIONS}_id_seq');`))
					.then(result => {
						client.release();
						transactionOldId = result.rows[0].currval;
						/* const transaction = {
							type: constant.transactions.LOAN,
							value: updatedValue,
							status: constant.status.PENDING,
						}; */
						chai.request(server)
							.patch(`/transactions/${banks[0].username}/${transactionOldId}`)
							// .send(transaction)
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
		});

		/* it('Update User-4 by Admin User-1', done => {
			const transaction = {
				type: constant.transactions.LOAN,
				value: updatedValue,
				status: constant.status.PENDING,
			};
			chai.request(server)
				.patch(`/transactions/${banks[0].username}/${users[4].transactions[0].id}`)
				.send(transaction)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		}); */

		it('Update by Creator', done => {
			/* const transaction = {
				value: updatedValue,
				status: constant.status.PENDING,
			}; */
			chai.request(server)
				.patch(`/transactions/${banks[0].username}/${transactionId}`)
				// .send(transaction)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});
	});

	describe('/DeleteTransaction W/ random users', () => {
		it('Delete Self by Accepted User-4', done => {
			chai.request(server)
				.delete(`/transactions/${banks[0].username}/${users[4].transactions[0].id}`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by NoLoggedIn', done => {
			chai.request(server)
				.delete(`/transactions/${banks[0].username}/${transactionId}`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by NotMember User-7', done => {
			chai.request(server)
				.delete(`/transactions/${banks[0].username}/${transactionId}`)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by Decliend User-5', done => {
			chai.request(server)
				.delete(`/transactions/${banks[0].username}/${transactionId}`)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by Pending User-6', done => {
			chai.request(server)
				.delete(`/transactions/${banks[0].username}/${transactionId}`)
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

	describe('/DeleteTransaction', () => {
		it('Delete OLD transaction by Creator should fail', done => { // 1 Week max
			chai.request(server)
				.delete(`/transactions/${banks[0].username}/${transactionOldId}`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by Admin is forbidden', done => {
			chai.request(server)
				.delete(`/transactions/${banks[0].username}/${users[0].transactions[3].id}`)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Delete by Creator', done => {
			chai.request(server)
				.delete(`/transactions/${banks[0].username}/${users[4].transactions[1].id}`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					done();
				});
		});
	});

	// Level 2
	// Total
	// Added User-0 875000 payment
	// Deleted User-4 2nd transaction
	//
	// Bank-0
	// Total 1001464999
	// Payments: 999999999-0 + 875000-0 + balance-0 + balance-4 +balance-4 + balance-2
	// Payments: 999999999 + 875000 + 10000 + 50000 + 50000 + 30000
	// Loans: -balance-0 -balance-4 = -60000
	// Instalments: balance-0 = 10000
	// Initials: 500000-0
	//
	//
	// Bank-1
	// Payments: balance-5
	//
	//
	// Bank-2
	// Payments: balance-6
};
