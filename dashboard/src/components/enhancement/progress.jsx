import React, { Component } from 'react';
import propTypes from 'prop-types';
import Progress from 'react-progress';

class ProgressEnhancement extends Component{
	smallSize = () => window.innerWidth < 500;
	render(){
		const headerHeight = 0;
		return(
			<Progress
				style={{top: headerHeight}}
				height={this.smallSize() ? 3 : 5}
				percent={this.props.percent}
				color={this.props.color ? this.props.color : 'rgb(104, 118, 120)'}
			/>
		);
	}
}

ProgressEnhancement.propTypes = {
	percent: propTypes.number.isRequired,
};

export default ProgressEnhancement;
