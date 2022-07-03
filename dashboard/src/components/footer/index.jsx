import React from 'react';
import FooterLoggedIn from './loggedin';
import FooterNotLoggedIn from './notloggedin';

class Footer extends React.Component{
	render(){
		let {
			className,
			style,
			isLoggedIn,
			sidebarOpen,
			sidebarShow,
			blog,
			isNotFound,
		} = this.props;

		if(isLoggedIn)
			return(
				<FooterLoggedIn
					className={className}
					style={style}
					sidebarShow={sidebarShow}
					sidebarOpen={sidebarOpen}
					blog={blog}
					isNotFound={isNotFound}
				/>
			);
		else
			return(
				<FooterNotLoggedIn
					className={className}
					style={style}
				/>
			);
	}
}
export default Footer;
