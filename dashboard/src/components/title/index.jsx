import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import propTypes from 'prop-types';
import classNames from 'classnames';

// Elements
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import DocumentTitle from 'components/documentTitle';

// Icons
import HelpIcon from '@material-ui/icons/HelpOutline';

const styles = theme => ({
	title: {
		'&:after': {
			content: '""',
			display: 'block',
			clear: 'both',
		}
	},
	padding: {
		padding: `${theme.spacing.unit*2}px ${theme.spacing.unit*3}px`,
	},
	back: {
		height: 40,
		float: 'left',
		[theme.breakpoints.down('xs')]: {
			float: 'none',
			textAlign: 'center',
			// width: '100%',
		}
	},
	backHolder: {
		[theme.breakpoints.down('xs')]: {
			display: 'flex',
			justifyContent: 'space-between',
			flexDirection: 'row-reverse',
		}
	},
	backHolderCenter: {
		[theme.breakpoints.down('xs')]: {
			textAlign: 'center',
		}
	},
	header: {
		float: 'right',
		marginBottom: 0,
		marginTop: 0,
		fontSize: 19,
		height: 48,
		[theme.breakpoints.down('xs')]: {
			float: 'none',
			clear: 'both',
			textAlign: 'center',
			margin: '0 auto',
		}
	},
});

class Title extends Component{
	render(){
		const {
			classes,
			className,
			label,
			subheader,
			back,
			button,
			help,
			padding,
			root } = this.props;

		return(
			<DocumentTitle title={label}>
				<div className={classNames(classes.title, root, padding ? classes.padding : '')}>
					<h1 className={classNames(classes.header, className)}>
						{label}
						{subheader &&
							<Typography component='p' variant='subheading'>{subheader}</Typography>
						}
						{help &&
							<IconButton component={Link} to={help}>
								<HelpIcon />
							</IconButton>
						}
					</h1>

					<div className={(button && back) ? classes.backHolder : classes.backHolderCenter}>
						{back &&
							<Button className={classes.back} color='primary' component={Link} to={back}>
								بازگشت
							</Button>
						}

						{button && (() => {
							const className = classNames(button.props.className, classes.back);
							return React.cloneElement(button, { className });
						})()
						}
					</div>
				</div>
			</DocumentTitle>
		);

	}
}

Title.propTypes = {
	label : propTypes.string.isRequired,
	back	: propTypes.string,
	help	: propTypes.string,
};

export default withStyles(styles)(Title);
