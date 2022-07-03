import React from 'react';
import utils from 'utils';
import BankHeaderReady from './ready';
import BankHeaderPlaceholder from './placeholder';

class BankHeader extends React.Component{
	render(){
		const {
			info,
			types,
			options,
			getBankOptions
		} = this.props;

		if(info)
			return(
				<BankHeaderReady
					id={info.id}
					title={info.name}
					username={info.username}
					avatar={utils.avatar.bank(info.avatar, info.username)}
					createdAt={utils.Miladi2Shamsi(info.created_at, 'jYYYY/jMM/jDD')}
					role={info.role}
					status={info.status}
					options={options}
					getBankOptions={getBankOptions}
					types={types}
				/>
			);
		else
			return(<BankHeaderPlaceholder />);
			// return (<LogoLoading center />);
	}
}

export default BankHeader;
