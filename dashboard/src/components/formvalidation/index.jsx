import React from 'react';

class FormValidation extends React.Component{
	state = {
		displayError: {},
	}

	isSame = (input, same) => {
		if(same) {
			return input.value === same.value;
		}
		else {
			return true;
		}
	}

	isOrValid = (input, or) => {
		if(or) {
			// return input.checkValidity() || or.checkValidity();
			return input.value || or.value;
		}
		else {
			return false;
		}
	}

	validatePassword = input => {
		const word = 'a-zA-Z@_\\-\\s#\\$%\\^\\&\\*\\(\\)\\=\\+\\[\\]';
		const pattern = `(((?=\\d)\\d[${word}])|((?=[${word}])[${word}]\\d))`;
		if(input.value.length < 8) {
			return 'رمز عبور باید حداقل ۸ کاراکتر داشته باشد';
		} else if(input.value.search(new RegExp(pattern)) === -1) {
			return 'رمز عبور باید از حروف و اعداد تشکیل شده باشد';
		}
		return false;
	}

	handleValidate = (form, input) => {
		if(typeof(input) !== 'object' || !input.getAttribute)
			return false;
		let displayError = this.state.displayError;
		let name = input.name;
		let type = input.type;
		let sameName = input.getAttribute('sameAs');
		let orName = input.getAttribute('or');
		let same = sameName && form.elements[sameName];
		let or = orName && form.elements[orName];
		if(name === '' || name === undefined)
			return false;
		if(or && !this.isOrValid(input, or))
			displayError[name] = 'ایمیل یا شماره باید وارد شود';
		else if(!this.isSame(input, same))
			displayError[name] = 'کلمات با هم مطابقت ندارند';
		else if(!(or && or.value) && !input.checkValidity())
			displayError[name] = true;
		else if(type === 'password')
			displayError[name] = this.validatePassword(input);
		else
			displayError[name] = false;
		this.setState({ displayError });
		return displayError[name];
	}

	handleSubmit = e => {
		e.preventDefault();
		let form = e.target;
		let isAllGood = true;
		// let displayError = {};
		for(let i = 0; i < form.elements.length; i++){
			let input = form.elements[i];
			let result = this.handleValidate(form, input);
			isAllGood &= !result;
		}
		// this.setState({ displayError });

		if(isAllGood && this.props.hasOwnProperty('onSubmit')){
			this.props.onSubmit(e);
		}
	}

	handleChange = e => {
		// e.preventDefault();
		let form = e.currentTarget;
		let input = e.target;
		this.handleValidate(form, input);

		if(this.props.hasOwnProperty('onChange')){
			this.props.onChange(e);
		}
	}

	handleFocus = e => {
		e.preventDefault();
		let input = e.target;
		let displayError = this.state.displayError;
		let name = input.name;
		displayError[name] = false;
		this.setState({ displayError });

		if(this.props.hasOwnProperty('onFocus')){
			this.props.onFocus(e);
		}
	}

	render(){
		const {
			displayError
		} = this.state;

		const {
			children,
			className,
			style
		} = this.props;

		return(
			<form
				onChange={this.handleChange}
				onFocus={this.handleFocus}
				onBlur={this.handleChange}
				onSubmit={this.handleSubmit}
				className={className}
				style={style}
				autoComplete="off"
				noValidate>
				{
					React.Children.map(children, (elem, i) => {
						const isError = !elem ? false : elem.props.error ? elem.props.error : displayError[elem.props.name];
						if((elem && elem.props.helperText) || (isError && isError.length > 0)){
							return React.cloneElement(elem, {
								error: isError ? true : false,
								// helperText: isError !== true ? isError : elem.props.helperText ,
								FormHelperTextProps: {
									style:{opacity: isError ? '1' : '0'}
								}
							});
						}else{
							return elem;
						}
					})
				}
			</form>
		);
	}
}

export default FormValidation;
