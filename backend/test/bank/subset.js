const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, users, banks, sessions, authorization, bankUserIds }) => {
	describe('/AddSubset by Creator', () => {
		it('Add subset with wrong clientID', done => {
			// const parentId = bankUserIds[banks[0].username][sessions[0].userId];
			const parentId = sessions[0].userId;
			const bank = {
				id: 1241512
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients/${parentId}`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add subset with wrong parentId', done => {
			const parentId = 1241512;
			const bank = {
				id: sessions[1].userId
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients/${parentId}`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add subset with another bank clientID', done => {
			// const parentId = bankUserIds[banks[0].username][sessions[0].userId];
			const parentId = sessions[0].userId;
			const bank = {
				id: sessions[5].userId
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients/${parentId}`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		/* it('Add subset with another bank parentId', done => {
			// const parentId = bankUserIds[banks[1].username][sessions[5].userId];
			const parentId = sessions[5].userId;
			const bank = {
				id: sessions[1].userId
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients/${parentId}`)
				.send(bank)
				.set('user-id', sessions[0].userId)
				.set('authorization', authorization(0))
				.end((err, res) => {
					res.should.have.status(404);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		}); */

		it('Add subset by user', done => {
			// const parentId = bankUserIds[banks[0].username][sessions[0].userId];
			const parentId = sessions[0].userId;
			const bank = {
				id: sessions[1].userId
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients/${parentId}`)
				.send(bank)
				.set('user-id', sessions[3].userId)
				.set('authorization', authorization(3))
				.end((err, res) => {
					res.should.have.status(403);
					res.body.should.be.a('object');
					res.body.status.should.be.eql('fail');
					done();
				});
		});

		it('Add subset', done => {
			const parentId = sessions[0].userId;
			const bank = {
				id: sessions[1].userId
			};
			chai.request(server)
				.put(`/banks/${banks[0].username}/clients/${parentId}`)
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
	});
};
