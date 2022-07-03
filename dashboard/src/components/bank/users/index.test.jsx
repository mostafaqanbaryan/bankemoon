import React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import Enzyme from 'enzyme';
import { TableRow, TableCell } from 'material-ui/Table';
import { createShallow } from 'material-ui/test-utils';
import Users from './index';

Enzyme.configure({ adapter: new Adapter() });


describe('<Users />', () => {
	let shallow, wrapper, mockUsers, mockSelected, handleShowTransaction;

	beforeEach(() => {
		shallow = createShallow();

		mockSelected = [];

		mockUsers = [
			{
				id: 1,
				name: 'MockUser1',
				balance: 10000,
				createdAt: '2017-11-09',
				avatar: 'https://api.adorable.io/avatars/face/eyes10/nose3/mouth1/f95'
			},
			{
				id: 2,
				name: 'MockUser2',
				balance: 20000,
				createdAt: '2017-11-09',
				avatar: 'https://api.adorable.io/avatars/face/eyes10/nose3/mouth1/f95'
			},
			{
				id: 3,
				name: 'MockUser3',
				balance: 30000,
				createdAt: '2017-11-09',
				avatar: 'https://api.adorable.io/avatars/face/eyes10/nose3/mouth1/f95'
			},
		];

		handleShowTransaction = () => {

		};

		wrapper = shallow(<Users users={mockUsers} selected={mockSelected} handleShowTransaction={handleShowTransaction} />);
	});


	it('Should render a list of users as an ordered list', () => {
		expect(wrapper.dive().find(TableRow).length).toEqual(mockUsers.length);
	});

	it('Should render users names', () => {
		let first = wrapper.dive().find(TableRow).first();
		expect(first.contains(mockUsers[0].name)).toEqual(true);
	})
});
