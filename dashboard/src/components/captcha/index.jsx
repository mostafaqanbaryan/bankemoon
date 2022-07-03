import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import ButtonBase from '@material-ui/core/ButtonBase';
import ReloadIcon from '@material-ui/icons/Cached';

const width = 400;
const styles = theme => ({
	captchaText: {
		width: 180,
		[`@media (max-width: ${width}px)`]: {
			width: '100%'
		}
	},
	captchaImg: {
		background: '#fa8072b8',
		borderRadius: '0 45px 45px 0',
		boxShadow: '0px 1px 5px 0px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.12)',
		overflow: 'hidden',
		width: 175,
		height: 50,
		float: 'left',
		[`@media (max-width: ${width}px)`]: {
			margin: '0 auto',
			float: 'none',
			clear: 'both',
		}
	},
	button: {
		'& .reload': {
			transition: 'background 0.2s',
			willChange: 'background',
		},
		'&:focus .reload, &:hover .reload': {
			background: 'rgba(0,0,0,0.3)',
		}
	},
	en: {
		fontFamily: theme.fonts.en,
		textAlign: 'left',
		direction: 'ltr'
	}
});

class Captcha extends React.Component{
	state={
		value: '',
		// error: true
	};

	handleChange = e => {
		this.setState({
			value: e.target.value,
			// error: e.target.value.length !== 5
		});
	};

	handleBlur = e => {
		if(this.state.value.length !== 5 && !this.state.error)
			this.setState({ error: true });
	};

	componentDidMount(){
		this.props.createCaptcha();
	};

	render(){
		const tabIndex = this.props.tabIndex || 0;
		const captcha = this.props.captcha;
		const createCaptcha = this.props.createCaptcha;
		const classes = this.props.classes || {};
		const value = this.state.value;
		const isError = this.props.error;

		return(
			<React.Fragment>
				<TextField
					type="text"
					label="کد امنیتی"
					name="captchaValue"
					required
					error={isError}
					onChange={this.handleChange}
					value={value}
					helperText='اعداد تصویر روبه‌رو را وارد کنید'
					className={classes.captchaText}
					FormHelperTextProps={{
						style: { opacity: isError ? 1 : 0 }
					}}
					InputProps={{ className: classes.en, autoComplete:'off'}}
					inputProps={{
						tabIndex,
						autoComplete:'off',
						pattern: '\\d+',
						maxLength: 5,
					}} />
				<div
					className={classes.captchaImg}>
					<input
						type='hidden'
						name='captchaId'
						value={captcha ? captcha.uuid : ''}
					/>
					<ButtonBase
						className={classes.button}
						tabIndex={tabIndex + 2}
						onClick={createCaptcha}>
							<div className='reload' style={{ width: 50, height: 50 }}>
								<ReloadIcon style={{ marginTop: 6, width: '1.5em', height: '1.5em' }} />
							</div>
							<img
								src={captcha && captcha.url}
								alt="تصویر کد امنیتی"
							/>
					</ButtonBase>
				</div>
			</React.Fragment>
		);
	}
}
export default withStyles(styles)(Captcha);
