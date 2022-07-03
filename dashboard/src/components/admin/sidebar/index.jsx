import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';

// Elements
import Button from '@material-ui/core/Button';

const styles = theme => ({
	root: {
		borderLeft: '1px solid #eee',
	}
});

class AdminSidebar extends Component {
	render(){
		const {
			classes
		} = this.props;

		const base = '/admin';
		return(
			<div className={classes.root}>
				<Button
					fullWidth
					component={Link}
					to={`${base}/dashboard/`}>
					داشبورد
				</Button>
				<Button
					fullWidth
					component={Link}
					to={`${base}/posts/`}>
					پست‌ها
				</Button>
				<Button
					fullWidth
					component={Link}
					to={`${base}/banks/`}>
					بانک‌ها
				</Button>
				<Button
					fullWidth
					component={Link}
					to={`${base}/users/`}>
					کاربران
				</Button>
				<Button
					fullWidth
					component={Link}
					to={`${base}/tickets/`}>
					تیکت‌ها
				</Button>
				<Button
					fullWidth
					component={Link}
					to={`${base}/logs/`}>
					گزارشات
				</Button>
				<Button
					fullWidth
					component={Link}
					to={`${base}/contacts/`}>
					پیام‌های ارتباط با ما
				</Button>
			</div>
		);
	}
}

export default withStyles(styles)(AdminSidebar);
