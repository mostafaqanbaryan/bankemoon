import API from 'api';
import React from 'react';
import propTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import InputAdornment from '@material-ui/core/InputAdornment';
import Autosuggest from 'react-autosuggest';

import HelpIcon from '@material-ui/icons/HelpOutline';

const styles = theme => ({
	caption: {
		paddingRight:5,
		flexGrow:1
	},
	container: {
		flexGrow: 1,
		position: 'relative',
		// height: 100,
		// width: 200,
	},
	suggestionsContainerOpen: {
		position: 'absolute',
		left: 0,
		right: 0,
		zIndex: 2000,
	},
	suggestion: {
		display: 'block',
	},
	suggestionsList: {
		margin: 0,
		padding: 0,
		maxHeight: 3*48,
		overflowY: 'auto',
		listStyleType: 'none',
	},
	left:{
		height: 25,
		direction: 'ltr',
	},
	en: {
		height: 25,
		fontFamily: theme.fonts.en,
		direction: 'ltr',
	}
});

class UserAutoSuggest extends React.Component{
	timeoutSuggestion = null;

	state = {
		value: '',
		suggestions: [],
	};

	handleChange = e => {
		this.setState({ value: e.target.value });
	};

	handleBlur = e => {
		this.setState({ value: '', suggestions: [] });
		if(this.props.onBlur)
			this.props.onBlur(e);
	};

	handleError = err => console.error(err);

	getSuggestions = query => {
		clearTimeout(this.timeoutSuggestion);
		this.timeoutSuggestion = setTimeout(() => {
			query = encodeURIComponent(query);
			const bankUsername = this.props.bankUsername;
			const key = 'search';
			const url = `/banks/${bankUsername}/clients/${key}/${query}`;
			const cb = {
				error: this.handleError,
				succeed: (result => {
					const users = this.props.exclude
						? result.data.users.filter(u => !this.props.exclude.includes(u.id))
						: result.data.users;
					this.setState({
						suggestions: users,
						error: null,
					});
				})
			};
			API.Result(cb, this.API.get({ url, key }));
		}, 200);
	};

	getSuggestionValue = suggestion => {
		return suggestion.full_name;
	};

	handleSuggestionsClearRequested = () => {
		this.setState({
			suggestions: [],
		});
	};

	handleSuggestionsFetchRequested = ({ value }) => {
		const fC = value.charAt(0);
		const threeChar = fC === '@' || fC === '0';
		if((threeChar && value.length >= 3) || (!threeChar && value.length >= 2))
			this.getSuggestions(value);
		else 
			this.handleSuggestionsClearRequested();
	};

	handleSuggestionSelected = (e, {suggestion, value, index, sectionIndex, method}) => {
		this.props.onClick(suggestion);
		this.setState({ value: '', suggestions: [] });
	};

	componentWillMount = () => {
		this.API = new API();
	};

	componentWillUnmount = () => {
		this.API.cancel();
	};

	render(){
		const {
			classes,
			style,
			disabled,
			margin
		} = this.props;
		const {
			value,
			suggestions,
		} = this.state;

		return(
			<Autosuggest
				suggestions={suggestions}
				onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
				onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
				onSuggestionSelected={this.handleSuggestionSelected}
				getSuggestionValue={this.getSuggestionValue}
				renderInputComponent={(props) => {
					const { classes, ref, ...other } = props;
					const fC = value && value.charAt(0);
					let className = '';
					let placeholder = 'نام و نام خانوادگی / @نام_کاربری / 09xxxxxxxxx';
					let label = 'انتخاب کاربر';
					if(fC){
						switch(fC){
							case '@':
								className = classes.en;
								label = 'نام کاربری';
								break;
							case '0':
								className = classes.left;
								label = 'شماره همراه';
								break;
							default:
								label = 'نام و نام خانوادگی';
						}
					}
					return(
						<TextField
							autoFocus
							fullWidth
							inputRef={ref}
							label={label}
							placeholder={placeholder}
							type='text'
							margin={margin}
							error={false}
							style={style}
							disabled={disabled}
							inputProps={{
								className,
							}}
							InputProps={{
								endAdornment: 
									<InputAdornment classes={{root: classes.inputAdornment}}>
										<Tooltip
											disableFocusListener={disabled}
											disableHoverListener={disabled}
											disableTouchListener={disabled}
											title='برای افزودن فرد بعد از نوشتن، نام را از لیست پیشنهادی انتخاب کنید'>
											<IconButton disabled={disabled}>
												<HelpIcon />
											</IconButton>
										</Tooltip>
									</InputAdornment>
								,...other,
							}}
						/>
					);
				}}
				renderSuggestionsContainer={(props) => (
					<Paper {...props.containerProps} square>
						{ props.children }
					</Paper>
				)}
				renderSuggestion={(suggestion, {query, isHighlighted}) => (
					<MenuItem selected={isHighlighted} component="div">
						<Typography>{suggestion.full_name}</Typography>
						<Typography
							className={classes.caption}
							variant='caption'>({suggestion.phone})</Typography>
					</MenuItem>
				)}
				theme={{
					container: classes.container,
					suggestionsContainerOpen: classes.suggestionsContainerOpen,
					suggestionsList: classes.suggestionsList,
					suggestion: classes.suggestion,
				}}
				inputProps={{
					classes,
					value,
					onChange: this.handleChange,
					onBlur: this.handleBlur
				}}
			/>
		);
	}
}

UserAutoSuggest.propTypes = {
	bankUsername: propTypes.string.isRequired,
	onClick: propTypes.func.isRequired,
	exclude: propTypes.array,
};
export default withStyles(styles)(UserAutoSuggest);
