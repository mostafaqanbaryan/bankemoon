import App, { Container } from 'next/app';
import React from 'react';
import Tag from '../components/Tag';
import Footer from '../components/Footer';
import Header from '../components/Header';

class BankemoonApp extends App {
	state = {
		isGoUpVisible: false,
	};

	showGoUp = () => {
		const isGoUpVisible = window.scrollY > window.innerHeight;
		if(isGoUpVisible !== this.state.isGoUpVisible)
			this.setState({ isGoUpVisible });
	};

	componentDidMount = () => {
		this.listenerGoUp = window.addEventListener('scroll', this.showGoUp);
		this.showGoUp();
	};

	componentWillUnmount = () => {
		window.removeEventListener('scroll', this.showGoUp);
	};

	render(){
		const {
			pageProps,
			Component,
		} = this.props;

		return(
			<Container>
				<Header
					isGoUpVisible={this.state.isGoUpVisible}
					isHomePage={Component.name === 'Home'}
				/>
				<Component {...pageProps} />
				<Footer
					isGoUpVisible={this.state.isGoUpVisible}
				/>
			</Container>
		);
	}
}

export default BankemoonApp;
