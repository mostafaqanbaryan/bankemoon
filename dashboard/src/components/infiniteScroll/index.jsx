import React from 'react';
import propTypes from 'prop-types';
import Loading from 'components/loading/button';

class InfiniteScroll extends React.Component{

	onScroll = e => {
		if(!this.props.loading && !this.props.isLastPage && window.scrollY + window.innerHeight >= document.body.offsetHeight - 500)
			this.props.onScroll();
	};

	componentDidMount = () => {
		window.addEventListener('scroll', this.onScroll , false);
	};

	componentWillUnmount = () => {
		window.removeEventListener('scroll', this.onScroll , false);
	};

	render(){
		return <Loading
			style={{ padding: '24px 0', margin: '0 auto' }}
			width={64}
			height={64}
			color='#ccc'
			show={this.props.loading}
			/>;
	}
}

InfiniteScroll.propTypes = {
	loading: propTypes.bool.isRequired,
	onScroll: propTypes.func.isRequired,
	isLastPage: propTypes.bool.isRequired,
};

export default InfiniteScroll;
