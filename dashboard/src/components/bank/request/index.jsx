import React from 'react';
import RequestPlaceholder from './placeholder';
import RequestReady from './ready';

class Request extends React.Component{
	render(){
		const {
			bankInfo
		} = this.props;

		if(bankInfo){
			return (
				<RequestReady
					{...this.props}
					bankInfo={bankInfo}
				/>
			);
		}
		else
			return (<RequestPlaceholder />);
	}
}

export default Request;
