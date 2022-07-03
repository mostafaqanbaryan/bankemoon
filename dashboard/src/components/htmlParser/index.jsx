import React from 'react';
import { Link } from 'react-router-dom';

const HtmlParser = content => {
	if(!content)
		return null;
	const reg = /<a href='([^\']+)'[^\>]*>([^\<]+)<\/a>/g;
	const result = [];
	let match = reg.exec(content);
	let index = 0;
	let len = 0;
	while(match){
		let replace = match[0];
		let url = match[1];
		let title = match[2];

		result.push(content.substr(index + len, match.index - index - len));
		result.push(<Link to={url}>{title}</Link>);

		index = match.index;
		len = replace.length;
		match = reg.exec(content);
	}
	result.push(content.substr(index + len));
	return React.createElement('p', null, result);
};

export default props => (
	<div>
		{HtmlParser(props.children)}
	</div>
);
