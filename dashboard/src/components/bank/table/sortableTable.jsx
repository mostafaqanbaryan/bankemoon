import React, { Component } from 'react';

// Elements
import Paper from '@material-ui/core/Paper';
import ColumnHeader from './columnHeader';
import Table from '@material-ui/core/Table';

class SortableTable extends Component{
	handleSortRequest = (e, p) => {
		const orderBy = p;
		let order = 'desc';

		if(this.state.order === p && this.state.order === order){
			order = 'asc';
		}

		const banks = this.getBanks(orderBy, order);
		this.setState({banks, order, orderBy});
	};

	handleChangePage = (e, page) => {
		this.setState({page});
	};

	handleSelectAllClick = (event, checked) => {
		if (checked) {
			this.setState({ selected: this.state.data.map(n => n.id) });
			return;
		}
		this.setState({ selected: [] });
	};

	/* handleClick = (e, id) => {
		const { selected } = this.state;
		const selectedIndex = selected.indexOf(id);
		let newSelected = [];

		if (selectedIndex === -1) {
			newSelected = newSelected.concat(selected, id);
		} else if (selectedIndex === 0) {
			newSelected = newSelected.concat(selected.slice(1));
		} else if (selectedIndex === selected.length - 1) {
			newSelected = newSelected.concat(selected.slice(0, -1));
		} else if (selectedIndex > 0) {
			newSelected = newSelected.concat(
				selected.slice(0, selectedIndex),
				selected.slice(selectedIndex + 1),
			);
		}

		this.setState({ selected: newSelected });
	}; */

	sendBackSelectAllClick = (event, checked) => {
	};

	render(){
		const { columnData, order, orderBy } = this.props;
		// const dataLength		 = data.length;
		// const selectedLength = selected ? selected.length : 0;
		// const emptyRows			 = rowsPerPage - Math.min(rowsPerPage, dataLength - page * rowsPerPage);

		return(
			<Paper elevation={0}>
				<div>
					<Table>
						<ColumnHeader
							columnData={columnData}
							order={order}
							orderBy={orderBy}
							onRequestSort={this.handleRequestSort}
						/>
						{this.props.children}
					</Table>
				</div>
			</Paper>
		);
	}
}

export default SortableTable;
