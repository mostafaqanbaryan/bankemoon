import React from 'react';
import ReactDOM from 'react-dom';
import { withStyles } from '@material-ui/core/styles';
import propTypes from 'prop-types';
import classNames from 'classnames';

import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';

// Icons
import WarningIcon from '@material-ui/icons/Warning';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import CloseIcon from '@material-ui/icons/Close';

// Colors
import Green from '@material-ui/core/colors/green';
import Amber from '@material-ui/core/colors/amber';


const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

const styles = theme => ({
	SnackContentAction: {
		marginLeft: -theme.spacing.unit,
		marginRight: 'auto',
		paddingRight: theme.spacing.unit * 3,
		paddingLeft: 0,
	},
	timeout: {
		'&:after': {
			content: '""',
			display: 'block',
			position: 'absolute',
			bottom: 0,
			left: 1,
			width: '99%',
			height: 2,
			animation: 'snack-timeout 5s linear forwards',
		},
	},
	success: {
		backgroundColor: Green[600],
		'&:after': {
			background: '#2e2',
		}
	},
	error: {
		backgroundColor: theme.palette.error.light,
		'&:after': {
			background: theme.palette.error.dark
		}
	},
	info: {
		backgroundColor: '#55a6ec',
		'&:after': {
			background: '#44e',
		}
	},
	warning: {
		backgroundColor: Amber[700],
		'&:after': {
			background: '#ff0',
		}
	},
	icon: {
		fontSize: 20,
	},
	iconVariant: {
		opacity: 0.9,
		marginLeft: theme.spacing.unit,
	},
	close: {
		color: '#fff',
	},
	message: {
		display: 'flex',
		alignItems: 'center',
	},
	'@keyframes snack-timeout': {
		from: {
			width: '100%',
		},
		to: {
			width: 0
		}
	}
});

class Snack extends React.Component{
	handleClose = (e, reason) => {
		if(reason ===  'clickaway') return;

		if(this.props.onClose)
			this.props.onClose();
	};

	handleExited = e => {
		// Restart animation
		let classes = this.props.classes;
		let element = ReactDOM.findDOMNode(this.timeoutContent);
		element.classList.remove(classes.timeout);
		void element.offsetWidth;
		element.classList.add(classes.timeout);

		if(this.props.onExited)
			this.props.onExited();
	};

	render(){
		let {
			classes,
			open,
			variant,
			message,
			...other
		} = this.props;

		const duration = 5000;
		const Icon = variantIcon[variant];

		return(
			<Snackbar
				anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
				open={open}
				autoHideDuration={duration}
				disableWindowBlurListener
				key={message}
				onExited={this.handleExited}
				onClose={this.handleClose}>
				<section>
					<SnackbarContent
						className={classNames(classes[variant], classes.timeout)}
						ref={timeoutContent => this.timeoutContent = timeoutContent}
						aria-describedby='snackbar'
						message={
							<span id='snackbar' className={classes.message}>
								<Icon className={classNames(classes.icon, classes.iconVariant)} />
								{message}
							</span>
						}
						action={[
							<IconButton
								key='close'
								aria-label='Close'
								className={classes.close}
								onClick={this.handleClose}>
								<CloseIcon className={classes.icon} />
							</IconButton>
						]}
						classes={{
							action: classes.SnackContentAction
						}}
					/>
				</section>
			</Snackbar>
		);
	}
}

Snack.propTypes = {
	variant: propTypes.oneOf(['success', 'warning', 'info', 'error']).isRequired,
	onClose: propTypes.func,
	onExited: propTypes.func,
	message: propTypes.string.isRequired,
	open: propTypes.bool,
	// duration: propTypes.integer
};

export default withStyles(styles)(Snack);
