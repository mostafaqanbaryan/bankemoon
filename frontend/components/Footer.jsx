import Link from 'next/link';
import Tag from './Tag';
import utils from '../utils';

const goUp = () => {
	const to = window.scrollY - 5;
	window.scrollTo(0, to);
	if(to <= 0) {
		clearInterval(this.interval);
	}
};

const handleGoUp = e => {
	this.interval = setInterval(() => goUp(), 1);
};

export default props => (
	<footer className='container text-right pb-3 mt-5'>
		<div className='row justify-content-between'>
			<section className='col-12 col-sm-12 col-lg-5'>
				<div className='mb-3' style={{maxWidth: 350}}>
					<strong style={{ lineHeight: '2rem' }}>
						<Tag href='/'>بانکمون</Tag> رو روی تلفن همراهتون نصب کنید تا همیشه بانک موردعلاقتون توی جیبتون باشه!
					</strong>
				</div>

				<div>
					<button className='btn btn-dark btn-cell-store mt-2 ml-2'>
						<span className='media align-items-center'>
							<span className='media-body'>
								<small className='d-block'>دانلود نسخه اندروید از</small>
								<strong>گوگل‌پلی</strong>
							</span>
							<span className='d-flex mr-2'>
								<i className='fab fa-google-play fa-2x'></i>
							</span>
						</span>
					</button>
					<button className='btn btn-dark btn-cell-store mt-2 '>
						<span className='media align-items-center'>
							<span className='media-body'>
								<small className='d-block'>دانلود نسخه آیفون از</small>
								<strong>اپل استور</strong>
							</span>
							<span className='d-flex mr-2'>
								<i className='fab fa-apple fa-2x'></i>
							</span>
						</span>
					</button>
				</div>
			</section>


			<section className='hidden col-sm-4 col-lg-2 mt-4 mt-lg-0'>
				<h4 className='h5 mb-4'>بانکمون</h4>
				<ul className='list-unstyled pr-0'>
					<li>
						<Link href='/terms' as='/terms/'>
							<a className='text-dark py-1 mb-1 d-block' rel='follow,index'>قوانین و مقررات</a>
						</Link>
					</li>
					<li>
						<Link href='/contact' as='/contact/'>
							<a className='text-dark py-1 d-block' rel='follow,index'>تماس با ما</a>
						</Link>
					</li>
					<li>
						<Link href='/about' as='/about/'>
							<a className='text-dark py-1 mb-1 d-block' rel='follow,index'>درباره ما</a>
						</Link>
					</li>
				</ul>
			</section>

			<section className='col-6 col-sm-4 col-lg-2 mt-4 mt-lg-0'>
				<h4 className='h5 mb-4'>وبلاگ</h4>
				<ul className='list-unstyled pr-0'>
					<li>
						<Link href='/blog/news' as='/blog/news/'>
							<a className='text-dark py-1 mb-1 d-block' rel='follow,index'>خبر‌ها</a>
						</Link>
					</li>
					<li>
						<Link href='/blog/tutorials' as='/blog/tutorials/'>
							<a className='text-dark py-1 d-block' rel='follow,index'>آموزش‌ها</a>
						</Link>
					</li>
				</ul>
			</section>

			<section className='col-6 col-sm-4 col-lg-2 mt-4 mt-lg-0'>
				<img id='jxlznbqesizpjxlzoeukesgt' style={{ cursor:'pointer' }} onClick={() => window.open("https://logo.samandehi.ir/Verify.aspx?id=129180&p=rfthuiwkpfvlrfthmcsiobpd", "Popup","toolbar=no, scrollbars=no, location=no, statusbar=no, menubar=no, resizable=0, width=450, height=630, top=30")} alt='logo-samandehi' src='https://logo.samandehi.ir/logo.aspx?id=129180&p=nbpdodrfbsiynbpdaqgwlyma' />
			</section>
		</div>

		<div className='text-center border-top pt-4 mt-5'>
			<Link href='/'>
				<a title='بانکمون'>
					<img className='navbar-logo' alt='لوگو' title='بانکمون' src={utils.cdn("/img/logo-black.svg")} />
				</a>
			</Link>
			<p className='mt-3 text-secondary' style={{ fontSize: '0.8rem' }}>
				تمامی حقوق سایت محفوظ است<br/>
				<Tag style={{ color: '#757575' }} href='/'>بانکمون</Tag> 1397
			</p>
		</div>

		<div onClick={handleGoUp} style={{transition: 'linear 0.5s', opacity: props.isGoUpVisible ? 1 : 0,}}>
			<button className={`${props.isGoUpVisible ? 'd-block' : 'd-none'} btn btn-secondary text-warning position-fixed rounded`} style={{ right: 30, bottom: 30 }}>
				<i className='fas fa-chevron-up'></i>
			</button>
		</div>
	</footer>
);
