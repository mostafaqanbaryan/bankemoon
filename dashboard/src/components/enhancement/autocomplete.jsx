import React from 'react';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';

function renderSuggestionsContainer(options) {
	const { containerProps, children } = options;

	return (
		<Paper {...containerProps} square>
			{children}
		</Paper>
	);
}

const styles = theme => ({
	container: {
		flexGrow: 1,
		position: 'relative',
		height: 100,
	},
	suggestionsContainerOpen: {
		position: 'absolute',
		zIndex: 1,
		marginTop: theme.spacing.unit,
		left: 0,
		right: 0,
	},
	suggestion: {
		display: 'block',
	},
	suggestionsList: {
		margin: 0,
		padding: 0,
		listStyleType: 'none',
	},
	suggestionSecondary: {
		fontSize: '0.7rem',
		textAlign: 'right',
	},
});

class AutocompleteEnhancement extends React.Component {
	state = {
		value: '',
		suggestions: [],
	};

	handleClick = user => e => {
		let res = this.props.onClick(e);
	}

	renderInput = inputProps => {
		const { classes, ref, ...other } = inputProps;
		let ip = this.props.textField.props.InputProps;
		ip.inputRef = ref;
		for(let i in other)
			ip[i] = other[i];

		return (
			React.cloneElement(
				this.props.textField,
				{
					InputProps: ip
				}
			)
		);
	}

	renderSuggestion = suggestion => {
		const {
			classes,
		} = this.props;

		return (
			<MenuItem onClick={this.handleClick(suggestion)} component="div">
				<div>
					{this.props.getSuggestionValue(suggestion)}
					<Typography className={classes.suggestionSecondary} color='textSecondary'>
						{this.props.getSuggestionSecondaryValue(suggestion)}
					</Typography>
				</div>
			</MenuItem>
		);
	}

	handleSuggestionsFetchRequested = ({ value }) => {
		this.setState({
			suggestions: this.props.getSuggestions(value),
		});
	};

	handleSuggestionsClearRequested = () => {
		this.setState({
			suggestions: [],
		});
	};

	handleChange = (event, {newValue}) => {
		this.props.onTextChange(newValue); 
		this.setState({
			value: newValue
		});
	};

	handleFocus = e => {
		this.setState({ value: '' });
	}

	render() {
		const {
			classes,
			getSuggestionValue,
			getSuggestions,
		} = this.props;

		return (
			<Autosuggest
				theme={{
					container: classes.container,
					suggestionsContainerOpen: classes.suggestionsContainerOpen,
					suggestionsList: classes.suggestionsList,
					suggestion: classes.suggestion,
				}}
				renderInputComponent={this.renderInput}
				suggestions={this.state.suggestions}
				onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
				onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
				renderSuggestionsContainer={renderSuggestionsContainer}
				getSuggestionValue={getSuggestionValue}
				renderSuggestion={this.renderSuggestion}
				inputProps={{
					value: this.state.value,
					onChange: this.handleChange,
					onFocus: this.handleFocus,
				}}
			/>
		);
	}
}

AutocompleteEnhancement.propTypes = {
	classes: PropTypes.object.isRequired,
	getSuggestions: PropTypes.func.isRequired,
	getSuggestionValue: PropTypes.func.isRequired,
};

export default withStyles(styles)(AutocompleteEnhancement);
