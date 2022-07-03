import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

// Elements
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Square from 'components/square';

const styles = theme => ({
	tableRow: {
		position: 'relative',
		height: '96px',
	},
	relative: {
		position: 'relative'
	},
	hiddenXs: theme.hidden.xs,
	hiddenSm: theme.hidden.sm,
	hiddenMd: theme.hidden.md,
	hiddenLg: theme.hidden.lg,
	hiddenXl: theme.hidden.xl,
});

class Session extends React.Component{
	render(){
		const {
			classes
		} = this.props;

		return(
			<TableBody>
				{[...Array(5)].map((zeros, i) => (
					<TableRow
						className={classes.tableRow}
						hover
						role="link"
						key={i}
						tabIndex={-1}>
						<TableCell className={classes.relative} padding="checkbox">
							<Square height={20} width='100%' />
						</TableCell>

						<TableCell className={classes.relative} padding="checkbox">
							<Square height={20} width='100%' />
						</TableCell>

						<TableCell className={classNames(classes.relative, classes.hiddenMd)} numeric>
							<Square height={20} width='100%' />
						</TableCell>

						<TableCell className={classNames(classes.relative, classes.hiddenXs)}>
							<Square height={20} width='100%' />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		);
	}
}

export default withStyles(styles)(Session);
