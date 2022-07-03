import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import propTypes from 'prop-types';

// Elements
import Paper from '@material-ui/core/Paper';
import Square from 'components/square';
import Title from 'components/title';

const styles = theme => ({
	root: {
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
	},
	paper: {
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
		marginTop: theme.spacing.unit*2,
	},
	margin: {
		margin: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
	}
});


class Request extends Component{

	render(){
		const { classes, } = this.props;
		return(
			<div>
				<Paper>
					<Title className={classes.root} label='ارسال درخواست به ...' />
				</Paper>
				<Paper className={classes.paper}>
					<Square className={classes.margin} height={30} width={170} />
					<Square className={classes.margin} height={20} width={270} />
					<Square className={classes.margin} height={20} width={125} />
					<Square className={classes.margin} height={20} width={220} />

					<Square className={classes.margin} height={30} width={170} />
					<Square className={classes.margin} height={20} width={270} />
					<Square className={classes.margin} height={20} width={125} />
					<Square className={classes.margin} height={20} width={220} />
				</Paper>
			</div>
		);
	}
}

Request.propTypes = {
	types				 : propTypes.array.isRequired,
	handleSubmit : propTypes.func.isRequired,
};
export default withStyles(styles)(Request);

