import React from 'react';
import { Link } from 'react-router-dom';
import Heart from '@material-ui/icons/Favorite';

class Beta extends React.Component{
	render(){
		return(
			<Link to='/tickets/new/' style={{ textDecoration: 'none' }}>
				<p style={{ textShadow: '1px 1px 1px #ccc', margin: 0 }}>
					<span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'rgba(232, 66, 66, 0.8)' }} >آزمایشی</span>
					<span style={{ fontSize: '0.6rem', color: '#333' }}>لطفا در صورت وجود هرگونه مشکل به ما تیکت بزنید
						<Heart style={{ color: 'rgba(232, 66, 66, 0.8)', verticalAlign: 'middle', fontSize: '0.7rem', marginBottom: 3 }} />
					</span>
				</p>
			</Link>
		);
	}
}
export default Beta;
