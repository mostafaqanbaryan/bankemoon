import React from 'react';
import pathToRegex from 'path-to-regexp';
import { Route, Redirect } from 'react-router-dom';

const cache = {};
const generatePath = (path, params) => {
	if(!cache[path])
		cache[path] = pathToRegex.compile(path);
	return cache[path](params);
}

const RedirectEnhancement = ({ to, from }) => {
	const render = props => (
		<Redirect to={generatePath(to, props.match.params)} />
	);
	return <Route exact path={from} render={render} />;
}

export default RedirectEnhancement;
