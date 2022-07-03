import API from 'api';
import React from 'react';
import Loading from 'components/loading/logo';
// import { Redirect } from 'react-router-dom';

class Logout extends React.Component{
	handleLogout = () => {
		const key = 'logout';
		let url = `/sessions/`;
		const cb = {
			error: err => {
				this.props.removeSession();
				this.props.history.replace('/auth/login/');
			},
			succeed: (result => {
				this.props.removeSession();
				this.props.history.replace('/auth/login/');
			})
		};
		API.Result(cb, this.API.delete({ url, key }));
	};

	componentWillMount = () => {
		this.API = new API();
		this.handleLogout();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};
	render(){
		return(
			<div style={{ background: '#eee', position: 'fixed', top: 0, bottom: 0, right: 0, left: 0, }}>
				<Loading style={{ position: 'fixed', right: 'calc(50% - 64px)', top: 'calc(50% - 64px)' }}/>
			</div>
		);
	}
}

export default Logout;
