const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

module.exports = ({ server, users, sessions, authorization }) => {
	describe('Sessions must have 8 items', () => {
		it('it should return success', done => {
			sessions.length.should.be.eql(8);
			done();
		});
	});
};
