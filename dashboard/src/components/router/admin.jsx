import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Route, Switch, Redirect } from 'react-router-dom';

// Elements
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';

import AdminPost from 'components/admin/posts/single';
import AdminPosts from 'components/admin/posts';
// import AdminPostNew from 'components/admin/posts/single';

import AdminLogs from 'components/admin/logs';
import AdminUsers from 'components/admin/users';
import AdminBanks from 'components/admin/banks';
import AdminTickets from 'components/admin/tickets';
import AdminSidebar from 'components/admin/sidebar';
import AdminContacts from 'components/admin/contacts';
import AdminDashboard from 'components/admin/dashboard';


const styles = theme => ({
	root: {
		padding: theme.spacing.unit*2,
	}
});

class RouterAdmin extends Component{
	render(){
		const {
			classes,
			user
		} = this.props;

		const base = '/admin';

		return(
			<div className={classes.root}>
					<Grid container spacing={16}>
						<Grid item xs={12} md={3} lg={2} xl={1}>
							<Paper>
								<AdminSidebar />
							</Paper>
						</Grid>
						<Grid item xs={12} md={9} lg={10} xl={11} className={classes.root}>
							<Switch>
								{user && user.role !== 'SiteAdmin' &&
									<Redirect push={false} to='/not-found/' />
								}
								<Route exact path={`${base}/dashboard`} render={ props => (
									<AdminDashboard
										{...props}
									/>
								)} />
								<Route exact path={`${base}/posts/:postId`} render={ props => (
									<AdminPost
										categories={this.props.types.post}
										{...props}
									/>
								)} />
								<Route exact path={`${base}/posts/`} render={ props => (
									<AdminPosts
										categories={this.props.types.post}
										{...props}
									/>
								)} />
								<Route exact path={`${base}/banks/page/:currentPage`} render={ props => (
									<AdminBanks
										{...props}
									/>
								)} />
								<Route path={`${base}/users/page/:currentPage`} render={ props => (
									<AdminUsers
										{...props}
									/>
								)} />
								<Route path={`${base}/contacts`} render={ props => (
									<AdminContacts
										types={this.props.types.status}
										{...props}
									/>
								)} />
								<Route path={`${base}/logs`} render={ props => (
									<AdminLogs
										{...props}
									/>
								)} />
								<Route path={`${base}/tickets`} render={ props => (
									<AdminTickets
										types={this.props.types.status}
										{...props}
									/>
								)} />

								<Redirect from={`${base}/banks`} to={`${base}/banks/page/1`} />
								<Redirect from={`${base}/users`} to={`${base}/users/page/1`} />
								<Redirect from={`${base}/posts`} to={`${base}/posts/page/1`} />
								<Redirect from={base} to={`${base}/dashboard/`} />
							</Switch>
						</Grid>
					</Grid>

			</div>
		);
	}
}

export default withStyles(styles)(RouterAdmin);
