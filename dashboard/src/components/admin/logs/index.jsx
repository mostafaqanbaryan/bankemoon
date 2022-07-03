import API from 'api';
import React from 'react';
import utils from 'utils';
import { withStyles } from '@material-ui/core/styles';
import swal from 'sweetalert';

// Elements
import Grid from '@material-ui/core/Grid';
import Modal from '@material-ui/core/Modal';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import Title from 'components/title';
import ErrorBoundary from 'components/errorBoundary';
import FormValidation from 'components/formvalidation';

import Green from '@material-ui/core/colors/green';
import Red from '@material-ui/core/colors/red';

const styles = theme => ({
	root: {
		padding: theme.spacing.unit * 3,
	},
	tickets: {
		borderRadius: 5,
		border:  '1px solid #ddd',
	},
	row: {
		cursor: 'pointer',
		padding: theme.spacing.unit * 2,
		borderBottom:  '1px solid #ddd',
		alignItems: 'center',
		'&:last-child': {
			borderBottom: 'none',
		}
	},
	modal: {
		position: 'absolute',
		height: 400,
		width: theme.spacing.unit * 50,
		backgroundColor: theme.palette.background.paper,
		boxShadow: theme.shadows[5],
		padding: theme.spacing.unit * 4,
		top: 'calc(50% - 250px)',
		right: `calc(50% - ${theme.spacing.unit*25}px)`,
		overflow: 'auto',
	},
	message: {
		border: '1px solid #ddd',
		marginTop: theme.spacing.unit*2,
		padding: theme.spacing.unit
	},
	textLeft: {
		fontFamily: theme.fonts.en,
		textAlign: 'left',
		direction: 'ltr',
	},
	accept: {
		color: Green.A700,
	},
	decline: {
		color: Red.A400,
	},
});

class Logs extends React.Component{
	state = {
		error: null,
		logs: [],
	}

	handleError = err => this.setState({ error: err.message });

	getLogs = () => {
		const key = 'logs';
		const url = `/admin/${key}/`;
		const cb = {
			error: this.handleError,
			succeed: result => this.setState({
				logs: result.data.logs,
				error: null,
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	}

	componentDidMount = () => {
		this.API = new API();
		this.getLogs();
	}

	componentWillUnmount = () => {
		this.API.cancel();
	}

	render(){
		const {
			error,
			logs,
		} = this.state;

		const {
			classes,
		} = this.props;

		return(
			<ErrorBoundary error={error} reload={this.getLogs}>
				<Paper className={classes.root}>
					<header>
						<Title
							label="گزارشات"
						/>
					</header>
					<section className={classes.tickets}>
						{logs.map(log => {
							return (
								<Grid className={classes.row} container key={log.id}>
									<Grid item sm={2}>
										<Typography>{utils.Miladi2Shamsi(log.created_at, 'jYYYY/jMM/jDD')}</Typography>
									</Grid>
									<Grid item sm={3}>
										<Typography>{log.name}</Typography>
									</Grid>
									<Grid item sm={3}>
										<Typography>{log.total} سطر</Typography>
									</Grid>
									<Grid item sm={3}>
										<Typography variant='caption'>{log.status}</Typography>
									</Grid>
								</Grid>
							);
						})}
					</section>
				</Paper>
			</ErrorBoundary>
		);
	}
}

export default withStyles(styles)(Logs);



