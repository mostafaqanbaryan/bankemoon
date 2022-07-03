import React, { Component } from 'react';
import classNames from 'classnames';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';

// Elements
import Chip from '@material-ui/core/Chip';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';

// Icons
import HelpIcon from '@material-ui/icons/Help';
import AddIcon from '@material-ui/icons/AddCircle';

import Logo from 'logo';

const styles = theme => {
	const headerMedia = 500;
	return {
		root: {
			background: 'rgba(255, 255, 255, 0.9)',
			position: 'fixed',
			marginBottom: 15,
			right: 0,
			left: 0,
			top: 0,
			zIndex: 1300,
			[`@media (max-width:${headerMedia}px)`]: {
				position: 'relative',
				marginBottom: 0,
			}
		},
		logoHolder: {
			float: 'right',
			display: 'block',
			height: 52,
			[`@media (max-width: ${headerMedia}px)`]:{
				paddingLeft: theme.spacing.unit * 2,
				paddingTop: theme.spacing.unit,
			}
		},
		logo: {
			[`@media (max-width: ${headerMedia}px)`]:{
				margin: '0 auto',
			}
		},
		toolbar:{
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'space-between',
			[`@media (max-width: ${headerMedia}px)`]:{
				flexDirection: 'column',
				justifyContent: 'center',
				textAlign: 'center',
			}
		},
		help: {
			marginLeft: 10,
			marginRight: 10,
			fontSize: '0.7rem',
			color: '#666',
			textDecoration: 'none',
			'&:hover': {
				color: '#222',
			},
			'&:focus': {
				color: '#222',
			},
			[`@media (max-width: ${headerMedia}px)`]:{
				display: 'block',
				marginBottom: 10,
				textAlign: 'right',
			}
		},
		helpHolder: {
			width: 315,
			paddingTop: theme.spacing.unit*2,
			[`@media (max-width: ${headerMedia}px)`]:{
				width: 165,
			}
		},
		helpIcon: {
			verticalAlign: 'middle',
			marginLeft: 2,
			height: 20,
			width: 20,
			color: '#7af',
		},
		addIcon: {
			color: '#3c5',
		},
		leftSection: {
			[`@media (max-width: ${headerMedia}px)`]:{
				marginTop: theme.spacing.unit,
				marginBottom: theme.spacing.unit,
			}
		},
		rightSection: {
			[`@media (max-width: ${headerMedia}px)`]:{
				margin: '0 auto',
			}
		}
}};

class Header extends Component{
	isSmall = () => window.innerWidth < 576;

	render(){
		const {
			classes,
			className
		} = this.props;

		return (
			<AppBar className={classNames(classes.root, className)} color='inherit' position='static'>
				<Toolbar className={classes.toolbar}>
					<div className={classes.rightSection}>
						<a className={classes.logoHolder} rel='index,follow' href='/'>
							<Logo className={classes.logo} showTitle={!this.isSmall()} color='#000' height={52} />
						</a>
						<div className={classes.helpHolder}>
							<a className={classes.help} href='/blog/tutorials/'>
								<HelpIcon className={classes.helpIcon} />
								راهنما
							</a>
							<Link className={classes.help} to='/auth/register/'>
								<AddIcon className={classNames(classes.helpIcon, classes.addIcon)} />
								عضویت
							</Link>
						</div>
					</div>

					<div className={classes.leftSection}>
						<Chip
							style={{textDecoration: 'none', cursor: 'pointer'}}
							label={'پشتیبانی: ' + process.env.SMS_OWNER}
							component={'a'}
							href={'tel: ' + process.env.SMS_OWNER}
						/>
					</div>
				</Toolbar>
			</AppBar>
		);
	}
}

Header.propTypes = {
	handleSidebarDrawer: propTypes.func.isRequired,
};
export default withStyles(styles)(Header);

