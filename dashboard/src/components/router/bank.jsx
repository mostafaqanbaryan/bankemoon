import API from 'api';
import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import Bank from 'components/bank';
import Request from 'components/bank/request';
// import RouteEnhancement from 'components/enhancement/route';
import ErrorBoundary from 'components/errorBoundary';

class RouterBank extends React.Component{
	state = {
		bankInfo: null,
		error: null,
	};

	getBankUsername = () => this.props.match.params.bankUsername || this.props.match.params.bankUsername1;

	handleGetError = result => {
		if(result && result.code === 404)
			this.props.history.replace('/not-found/');
		else
			this.setState({ error: result.message });
	};

	getBank = bankUsername => {
		const key = 'getBank';
		const url = `/banks/${bankUsername}/`;
		const cb = {
			error: this.handleGetError,
			succeed: (result => {
				this.setState({
					bankInfo: result.data.bank.info,
					bankBadges: result.data.bank.badges,
					error: null,
				});
			})
		};
		API.Result(cb, this.API.get({ url, key }));
	};

	updateBankAvatar = avatar => {
		const bankInfo = this.state.bankInfo;
		bankInfo.avatar = avatar;
		this.setState({ bankInfo });
	};

	updateBankInfo = (name, value) => {
		const bankInfo = this.state.bankInfo;
		bankInfo[name] = value;
		this.setState({ bankInfo });
	};

	updateBankBadges = (name, value) => {
		const bankBadges = this.state.bankBadges;
		bankBadges[name] = value;
		this.setState({ bankBadges });
	};

	componentWillMount = () => {
		this.API = new API();
		const bankUsername = this.getBankUsername();
		this.getBank(bankUsername);
	};

	componentDidMount = () => {
		// Scroll to view
		this.props.history.listen((location, action) => {
			const content = document.getElementById('bank-content');
			if(content)
				content.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
		});
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			bankInfo,
			bankBadges,
			error,
		} = this.state;

		return(
			<ErrorBoundary error={error}>
				<Switch>
					<Route exact path='/@:bankUsername/request' render={ props => {
						if(bankInfo && (bankInfo.status === 'Pending' || bankInfo.status === 'Declined'))
							return <Redirect to='/not-found/' />;
						return <Request
							getUserId={this.props.getUserId}
							bankInfo={bankInfo}
							{...this.props}
							{...props}
						/>;
					}} />

					<Route path={['/@:bankUsername1/page/:currentPage', '/@:bankUsername']} render={ props => {
						if(bankInfo && (!bankInfo.user_id || bankInfo.status === 'Pending' || bankInfo.status === 'Declined'))
							return <Redirect to='/not-found/' />;
						return <Bank
							getUserId={this.props.getUserId}
							bankInfo={bankInfo}
							updateBankAvatar={this.updateBankAvatar}
							updateBankInfo={this.updateBankInfo}
							bankBadges={bankBadges}
							updateBankBadges={this.updateBankBadges}
							{...this.props}
							{...props} />;
					}} />
				</Switch>
			</ErrorBoundary>
		);
	}
}

export default RouterBank;
