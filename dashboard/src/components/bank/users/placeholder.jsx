import React from 'react';
import propTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

// Elements
import SortableTable from '../table/sortableTable';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import Square from 'components/square';
import Circle from 'components/circle';

// Colors
import Green from '@material-ui/core/colors/green';
import Teal from '@material-ui/core/colors/teal';
import Red from '@material-ui/core/colors/red';
import Indigo from '@material-ui/core/colors/indigo';


const styles = theme => ({
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
	request: {
		height: '38px',
		width: '38px',
		background: Green.A700,
		'&:hover': {
			background: Green.A400
		}
	},
	avatar: {
		height: '64px',
		width: '64px',
		cursor: 'pointer',
		background: Teal[500]
	},
	tableRow: {
		height: '96px',
	},
	tableRowSubset: {
		transform: 'scaleX(0.92)',
		transformOrigin: 'left',
	},
	promoteUser: {
		// color: Green[500],
		'&:hover': {
			color: Green[500]
		}
	},
	deleteUser: {
		// color: Red[500],
		'&:hover': {
			color: Red[400]
		}
	},
	transaction:{
		// color: Indigo[500],
		'&:hover': {
			color: Indigo[400]
		}
	}
});

class UsersPlaceholder extends React.Component{
	render(){
		const {
			classes,
			columnData,
			rowsPerPage,
		} = this.props;

		return (
			<SortableTable
				data={[...Array(rowsPerPage)]}
				rowsPerPage={rowsPerPage}
				columnData={columnData}
				>
					{[...Array(rowsPerPage)].map((zero, i) => {
						return(
							<TableBody key={i}>
								<TableRow
									className={classes.tableRow}
									hover
									role="link"
									selected={false}
									tabIndex={-1}
									key={i}>
									<TableCell className={classes.hiddenXs} padding="checkbox">
										<Circle diameter={64} />
									</TableCell>

									<TableCell padding="checkbox">
										<Square height={20} width={170} />
									</TableCell>

									<TableCell className={classes.hiddenSm} numeric>
										<Square height={20} width={130} />
									</TableCell>

									<TableCell className={classes.hiddenMd}>
										<Square height={20} width={100} />
									</TableCell>

									<TableCell padding="checkbox">
									</TableCell>
								</TableRow>
							</TableBody>
						);
					})}
			</SortableTable>
		);
	}
}
UsersPlaceholder.propTypes = {
	rowsPerPage: propTypes.number.isRequired,
	columnData: propTypes.array.isRequired,
};
export default withStyles(styles)(UsersPlaceholder);

