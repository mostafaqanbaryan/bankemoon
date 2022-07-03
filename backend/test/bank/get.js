const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, users, banks, sessions, authorization }) => {
	let clientsLength = 5;
	describe('/Get BankInfo', () => {
		it('Access BankInfo is open for loggedIn', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/`)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.an('object');
					res.body.status.should.be.eql('success');
					res.body.data.bank.should.be.an('object');
					res.body.data.bank.should.have.all.keys('badges', 'info');
					res.body.data.bank.badges.should.be.an('object');
					should.not.exist(res.body.data.bank.info.id);
					should.not.exist(res.body.data.bank.info.avatar);
					should.not.exist(res.body.data.bank.info.user_id);
					should.not.exist(res.body.data.bank.info.status);
					should.not.exist(res.body.data.bank.info.role);
					done();
				});
		});

		it('Access BankInfo is open for Pending', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/`)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.bank.should.be.a('object');
					res.body.data.bank.should.have.all.keys('badges', 'info');
					res.body.data.bank.badges.should.be.an('object');
					res.body.data.bank.info.id.should.be.above(0);
					res.body.data.bank.info.user_id.should.be.above(0);
					res.body.data.bank.info.status.should.be.eql('Pending');
					should.not.exist(res.body.data.bank.info.role);
					done();
				});
		});

		it('Access BankInfo is open for members', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.bank.should.be.a('object');
					res.body.data.bank.should.have.all.keys('badges', 'info');
					res.body.data.bank.badges.should.be.an('object');
					res.body.data.bank.info.id.should.be.above(0);
					res.body.data.bank.info.user_id.should.be.above(0);
					should.not.exist(res.body.data.bank.info.status);
					should.not.exist(res.body.data.bank.info.role);
					done();
				});
		});

		it('Access BankInfo is forbidden for notLoggedIn', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/Get BankOptions', () => {
		it('Access BankOptions is open for BankMember', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/options`)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.options.should.be.a('object');
					res.body.data.options.should.have.all.keys('description', 'rules', 'shaba', 'owner');
					done();
				});
		});

		it('Access BankOptions is open for loggedIn W/O shaba/owner', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/options`)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.options.should.be.a('object');
					res.body.data.options.should.have.all.keys('description', 'rules').but.not.have.all.keys('shaba', 'owner');
					done();
				});
		});

		it('Access BankOptions is closed for notLoggedIn', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/options`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});
	});

	describe('/Get BankUsers', () => {
		it('Access Users W/O Login', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					res.body.message.should.be.eql('ابتدا وارد شوید');
					done();
				});
		});

		it('Access Users W User-2 Added By Creator', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients`)
				.set('user-id', sessions[2].userId)
				.set('authorization', authorization(2))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.users.should.be.a('array');
					res.body.data.users.length.should.be.eql(clientsLength);
					done();
				});
		});

		it('Access Users W User-4 W accepted JoinRequest', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.users.should.be.a('array');
					res.body.data.users.length.should.be.eql(clientsLength);
					done();
				});
		});

		it('Access Users W User-5 W declined JoinRequest', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients`)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Access Users W User-6 W pending JoinRequest', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients`)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Access Users W User-7 W/O Member', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients`)
				.set('user-id', sessions[7].userId)
				.set('authorization', authorization(7))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Access Users W Creator', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients`)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.users.should.be.a('array');
					res.body.data.users.length.should.be.eql(clientsLength);
					done();
				});
		});

		it('Access Users W Admin', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients`)
				.set('user-id', sessions[1].userId)
				.set('authorization', authorization(1))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.users.should.be.a('array');
					res.body.data.users.length.should.be.eql(clientsLength);
					done();
				});
		});
	});

	describe('/Get Search Users by FullName', () => {
		const firstName = encodeURIComponent(users[0].firstName.substr(0, 2));
		const lastName = encodeURIComponent(users[0].lastName.substr(0, 3));
		const fullNamePartial = encodeURIComponent(users[0].firstName.substr(0, 2) + ' ' + users[0].lastName.substr(0, 3));
		const fullName = encodeURIComponent(users[0].firstName + ' ' + users[0].lastName.substr(0, 8));
		it('Access SearchUser W/O Login has Failed', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/search/${firstName}`)
				.end((err, res) => {
					res.should.have.status(401);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					res.body.message.should.be.eql('ابتدا وارد شوید');
					done();
				});
		});

		it('Access SearchUser W/ Pending has Failed', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/search/${firstName}`)
				.set('user-id', sessions[6].userId)
				.set('authorization', authorization(6))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Access SearchUser W/ Declined has Failed', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/search/${firstName}`)
				.set('user-id', sessions[5].userId)
				.set('authorization', authorization(5))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Access SearchUser W/ Accepted W/ firstName has Succeed', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/search/${firstName}`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.have.keys('users');
					res.body.data.users.should.be.an('array');
					res.body.data.users.length.should.be.eql(3);
					done();
				});
		});

		it('Access SearchUser W/ Accepted W/ lastName has Succeed', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/search/${lastName}`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.have.keys('users');
					res.body.data.users.should.be.an('array');
					res.body.data.users.length.should.be.eql(3);
					done();
				});
		});

		it('Access SearchUser W/ Bad name', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/search/asda`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.have.keys('users');
					res.body.data.users.should.be.an('array');
					res.body.data.users.length.should.be.eql(0);
					done();
				});
		});

		it('Access SearchUser W/ partial firstName in fullName', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/search/${fullNamePartial}`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.have.keys('users');
					res.body.data.users.should.be.an('array');
					res.body.data.users.length.should.be.eql(0);
					done();
				});
		});

		it('Access SearchUser W/ fullName', done => {
			chai.request(server)
				.get(`/banks/${banks[0].username}/clients/search/${fullName}`)
				.set('user-id', sessions[4].userId)
				.set('authorization', authorization(4))
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('success');
					res.body.data.should.have.keys('users');
					res.body.data.users.should.be.an('array');
					res.body.data.users.length.should.be.eql(1);
					done();
				});
		});
	});
};
