import API from 'api';
import Tag from 'components/Tag';
import Page from 'components/Page';

export default class Contact extends React.Component{
	static getInitialProps(){
		const title = 'ارتباط با ما';
		const description = 'راه های ارتباطی با تیم پشتیبانی سامانه مدیریت قرض الحسنه فامیلی و خانوادگی بانکمون در جهت بهبود و رفع مشکلات سامانه برای خدمت‌رسانی بهتر';
		const canonical = '/contact/';
		const structuredData = {
			"@context": "http://schema.org",
			"@type": "ContactPage",
			"url": `https://bankemoon.com${canonical}`,
			"name": 'ارتباط با بانکمون',
			"about": "Contact and Support Page",
			"creator": {
				"@type": "Organization",
				"name": "بانکمون"
			},
			"mainContentOfPage": '.page',
			"relatedLink": "https://bankemoon.com/portal/",
			"significantLink": "https://bankemoon.com/portal/",
			"keywords": "ارتباط,راه ارتباط,ارتباط با بانکمون,آدرس بانکمون,شماره بانکمون,تلفن بانکمون,تلگرام بانکمون"
		};

		return {
			structuredData,
			title,
			description,
			canonical,
		};
	}

	state = {
		error: null,
		sent: false,
		loading: false,
		isSmall: false,
	};

	handleSmall = () => {
		const isSmall = window && window.innerWidth < 768;
		if(isSmall !== this.state.isSmall)
			this.setState({ isSmall });
	};

	handleError = err => this.setState({ error: err.message, loading: false, sent: false, });

	handleSubmit = e => {
		this.setState({ loading: true });
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const key = 'contact';
		const url = `/${key}/`;
		const cb = {
			error: this.handleError,
			succeed: result => {
				this.setState({
					error: null,
					sent: true,
					loading: false,
				});
			}
		};
		API.Result(cb, this.API.post({ url, key, formData }));
	};

	componentWillMount = () => {
		this.API = new API();
	};

	componentDidMount = () => {
		window.addEventListener('resize', this.handleSmall);
		this.handleSmall();
	};

	componentWillUnmount = () => {
		window.removeEventListener('resize', this.handleSmall);
		this.API.cancel();
	};

	render(){
		const isSmall = this.state.isSmall;
		return(
			<Page {...this.props}>
				<div className='row'>
					<div className='col-12 col-lg-6'>
						<p>
							جهت ارتباط با ما برای انتقال پیشنهادات و انتقادات خود و یا همکاری از طریق روش‌های	زیر اقدام کنید؛ و یا از طریق فرم {isSmall ? 'زیر' : 'روبه‌رو'} پیام خود را برای ما ارسال کنید.
						</p>

						<ul className='list-unstyled pr-0 pl-5'>
							<li className='mb-3'>
								<i className={`fas fa-phone ${isSmall ? 'fa-2x' : 'fa-3x'}`}></i>
								<a className='mr-3' href={'tel:' + process.env.SMS_OWNER}>{process.env.SMS_OWNER}</a>
							</li>

							<li className='mb-3'>
								<i className={`fab fa-telegram align-middle ${isSmall ? 'fa-2x' : 'fa-3x'}`}></i>
								<a className='mr-3' rel='nofollow' href='https://t.me/AppistGroup'>ارسال پیام در پیام‌رسان تلگرام</a>
							</li>

							<li className='mb-3'>
								<svg xmlns="http://www.w3.org/2000/svg" width={isSmall ? '32px' : '48px'} height={isSmall ? '32px' : '48px'} viewBox="0 0 128 128">
									<path id="soroush" fill="#212529" stroke="black" strokeWidth="1" d="M 87.00,121.01 C 87.00,121.01 67.00,124.83 67.00,124.83 56.21,125.86 40.07,121.13 31.00,115.30 20.50,108.56 14.27,102.17 8.60,91.00 2.49,78.95 1.85,72.21 2.00,59.00 2.09,51.45 4.00,42.81 7.26,36.00 25.41,-1.90 76.36,-12.57 107.00,17.04 113.45,23.28 116.68,27.91 120.37,36.00 124.12,44.23 125.89,50.90 126.00,60.00 126.15,73.07 124.07,83.67 117.17,95.00 109.76,107.18 104.15,106.33 104.00,117.00 103.94,121.60 104.31,123.40 103.00,128.00 98.19,126.48 90.65,121.22 87.00,121.01 Z M 70.00,27.48 C 67.26,28.63 65.22,29.99 63.10,32.10 56.52,38.68 54.62,48.06 56.52,57.00 57.81,63.10 60.41,67.13 59.90,74.00 59.31,82.10 52.05,89.65 44.00,90.79 40.97,91.21 37.97,90.53 35.00,90.00 50.74,111.43 94.76,103.92 93.99,72.00 93.80,64.23 90.07,56.24 85.61,50.00 82.48,45.61 76.48,38.69 77.43,33.00 77.85,30.52 79.80,27.28 81.00,25.00 77.22,25.32 73.52,26.00 70.00,27.48 Z M 34.00,89.00 C 34.00,89.00 35.00,90.00 35.00,90.00 35.00,90.00 35.00,89.00 35.00,89.00 35.00,89.00 34.00,89.00 34.00,89.00 Z" />
								</svg>
								<a className='mr-3' rel='nofollow' href='https://sapp.ir/AppistGroup'>ارسال پیام در پیام‌رسان سروش</a>
							</li>

							<li className='mb-3'>
								<i className={`fab fa-facebook align-middle ${isSmall ? 'fa-2x' : 'fa-3x'}`}></i>
								<a className='mr-3' rel='nofollow' href='https://fb.com/bankemooncom'>صفحه شخصی در فیسبوک</a>
							</li>

							<li className='mb-3'>
								<i className={`fab fa-twitter-square align-middle ${isSmall ? 'fa-2x' : 'fa-3x'}`}></i>
								<a className='mr-3' rel='nofollow' href='https://twitter.com/AppistGroup'>دنبال کردن اخبار از طریق توئیتر</a>
							</li>


							<li className='mb-3'>
								<i className={`fab fa-instagram align-middle ${isSmall ? 'fa-2x' : 'fa-3x'}`}></i>
								<a className='mr-3' rel='nofollow' href='https://instagram.com/bankemoon'>ارتباط از طریق اینستاگرام</a>
							</li>
						</ul>
					</div>
					
					<div className='col-12 col-lg-6'>
						<form className='row' onSubmit={this.handleSubmit}>
							<div className='col-12 form-group'>
								<label htmlFor='fullname'>نام و نام خانوادگی</label>
								<input className='form-control' type='text' id='fullname' name='fullname' maxLength={32} required />
								<small className='form-text text-muted'>نام خود را به زبان فارسی بنویسید</small>
							</div>

							<div className='col-6 form-group ltr'>
								<label htmlFor='email'>ایمیل</label>
								<input className='form-control' type='email' id='email' name='email' maxLength={32} required />
								<small className='form-text text-muted'>ذکر ایمیل ضروری است</small>
							</div>

							<div className='col-6 form-group ltr'>
								<label htmlFor='phone'>تلفن همراه</label>
								<input className='form-control' type='phone' id='phone' name='phone' maxLength={11} required pattern='^09\d{9}$'/>
								<small className='form-text text-muted'>شماره خود را به صورت 11 رقمی وارد کنید</small>
							</div>

							<div className='col-12 form-group'>
								<label htmlFor='subject'>عنوان پیام</label>
								<input className='form-control' type='text' id='subject' name='subject' maxLength={32} required />
								<small className='form-text text-muted'>عنوان پیام را به زبان فارسی بنویسید</small>
							</div>

							<div className='col-12 form-group'>
								<label htmlFor='content'>متن پیام</label>
								<textarea className='form-control' type='text' id='content' name='content' rows={4} minLength={10} required></textarea>
								<small className='form-text text-muted'>توضیحات خود را به زبان فارسی بنویسید</small>
							</div>

							{(this.state.error || this.state.sent) &&
								<div className='text-center w-100'>
									{this.state.error &&
										<p className='text-danger' style={{ whiteSpace: 'pre-line' }}>
											پیام ارسال نشد<br/>
											{this.state.error}
										</p>
									}
									{this.state.sent &&
										<p className='text-success' style={{ whiteSpace: 'pre-line' }}>
											پیام ارسال شد<br/>
											در صورت نیاز با شما تماس حاصل خواهد شد
										</p>
									}
								</div>
							}

							<div className='col-12 text-left'>
								<button type='submit' className={`btn btn-primary ${isSmall ? 'btn-block' : ''}`} disabled={this.state.loading ? true : false}>ارسال</button>
							</div>
						</form>
					</div>
				</div>
			</Page>
		);
	}
}
