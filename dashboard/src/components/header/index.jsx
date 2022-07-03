import React, { Component } from 'react';
import HeaderNotLoggedIn from './notloggedin';
import HeaderLoggedIn from './loggedin';

class Header extends Component{
	render(){
		let {
			className,
			style,
			isLoggedIn,
		} = this.props;

		if(isLoggedIn)
			return(
				<HeaderLoggedIn
					className={className}
					style={style}
					{...this.props}
				/>
			);
		else
			return(
				<HeaderNotLoggedIn
					className={className}
					style={style}
					{...this.props}
				/>
			);
	}
}

export default Header;
