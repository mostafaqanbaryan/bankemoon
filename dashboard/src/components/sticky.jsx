import { Component } from 'react';

class Sticky extends Component{
	handleScroll = (e) =>{
		this.props.handleScroll(e);
	}

	componentDidMount(){
		window.addEventListener('scroll', this.handleScroll);
	}

	componentWillUnmount(){
		window.removeEventListener('scroll', this.handleScroll);
	}

	render(){
		const { children } = this.props;
		return(
			children
		);
	}
}

export default Sticky;
