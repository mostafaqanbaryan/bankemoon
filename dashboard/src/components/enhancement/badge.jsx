import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Badge from '@material-ui/core/Badge';
import Zoom from '@material-ui/core/Zoom';

const styles = {
	fullWidth: {
		width: '100%'
	},
	root: {
		top: -8,
		right: -8,
	},
	zoom: {
		position: 'absolute',
		zIndex: 10,
	}
};

class BadgeEnhancement extends Component{
	zoom = (badge, children) => {
		const { classes, timeout, } = this.props;
		return(
			<div>
				<Zoom className={classes.zoom} in timeout={timeout || 0}  style={this.props.timeDelay > 0 ?{transitionDelay: this.props.timeDelay} : {}} unmountOnExit>
					{badge}
				</Zoom>
				{children}
			</div>
		);
	}

	badge = () => {
		const { classes, badgeContent, fullWidth, color, } = this.props;
		return (
			<Badge classes={{badge: classes.root}} className={fullWidth ? classes.fullWidth : ''} badgeContent={badgeContent} color={color || 'primary'}>
				<React.Fragment></React.Fragment>
			</Badge>
		);
	}

	render(){
		const { children, badgeContent, } = this.props;
		return(
				badgeContent > 0
					? this.zoom(this.badge(), children)
					: children
		);
	}
}

export default withStyles(styles)(BadgeEnhancement);
