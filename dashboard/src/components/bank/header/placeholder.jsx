import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';

// Elements
import Grid from '@material-ui/core/Grid';
import Circle from 'components/circle';
import Square from 'components/square';

const styles = theme => ({
	title: {
		background: theme.palette.common.white,
		boxShadow: theme.shadows[4],
		padding: '5px 10px',
		marginBottom: 10,
	},
	leftSection:{
		marginTop: '20px',
		direction: 'ltr',
		[theme.breakpoints.down('xs')]: {
			width: '100%',
		}
	},
	circle:{
		[theme.breakpoints.down('xs')]: {
			margin: '0 auto',
		}
	},
	square: {
		[theme.breakpoints.down('xs')]: {
			margin: '0 auto',
		}
	},
	marginBottom: {
		marginBottom: theme.spacing.unit
	}
});

class BankHeaderPlaceholder extends Component{
	render(){
		const { classes, } = this.props;
		return(
			<Grid container spacing={0} className={classes.title}>
				<Grid item xs={12} sm={10}>
					<Square height={37} width={100} className={classes.square} style={{marginBottom: 12}} />
					<Square height={24} width={180} className={classes.square} style={{marginBottom: 4}} />
					<Square height={24} width={70} className={classes.square} />
				</Grid>

				<Grid className={classes.leftSection} item xs={12} sm={2}>
					<Circle className={classes.circle} diameter={70} />
				</Grid>
			</Grid>
		);
	}
}

export default withStyles(styles)(BankHeaderPlaceholder);
