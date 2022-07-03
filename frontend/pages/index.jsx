import Typed from 'typed.js';

import Card from '../components/Card';
import Meta from '../components/Meta';
import Tag from '../components/Tag';
import Stepper from '../components/Stepper';
import utils from '../utils';

const steps = [
	{
		title: 'راه‌اندازی بانکمون',
		text: <p className='text-justify'>طراحی و راه‌اندازی سامانه اینترنتی <Tag href='/'>مدیریت قرض‌الحسنه خانوادگی بانکمون</Tag> با جدیدترین تکنولوژی‌های دنیا برای تمامی تلفن‌های همراه و سیستم‌های خانگی</p>,
	},
	{
		title: 'اتصال درگاه پرداخت اینترنتی',
		text: <p className='text-justify'>دریافت نماد اعتماد الکترونیکی و مجوز‌های لازم جهت اتصال درگاه پرداخت اینترنتی برای واریز وجوه اقساط و سپرده‌ی ماهیانه‌ی کاربران به حساب <Tag href='/'>قرض‌الحسنه</Tag></p>
	},
	{
		title: 'بانکمون برای اندروید',
		text: <p className='text-justify'>طراحی و ارائه‌ی نرم‌افزار <Tag href='/'>بانکمون</Tag> مخصوص تلفن‌های همراه با سیستم‌عامل <Tag href='/'>اندروید</Tag> برای مدیریت کارا و دریافت اعلان‌های قرض‌الحسنه‌های کاربران</p>
	},
	{
		title: 'بانکمون برای iOS',
		text: <p className='text-justify'>طراحی و ارائه‌ی نرم‌افزار <Tag href='/'>بانکمون</Tag> مخصوص تلفن‌های همراه <Tag href='/'>آیفون</Tag> با سیستم‌عامل <Tag href='/'>iOS</Tag> برای مدیریت کارا و دریافت اعلان‌های قرض‌الحسنه</p>
	},
];

class Home extends React.Component{
	static getInitialProps(){
		const title = 'بانکمون | مدیریت قرض الحسنه اینترنتی فامیلی';
		const description = 'سامانه اینترنتی بانکمون برای مدیریت قرض الحسنه های خانوادگی و فامیلی قابل نصب برروی تمامی سیستم عامل ها و دارای درگاه پرداخت اینترنتی برای واریز وجه به حساب قرض الحسنه شما به صورت رایگان';
		const structuredData = {
			"@context": "http://schema.org",
			"@type": "Organization",
			"@id": "https://bankemoon.com",
			"url": "https://bankemoon.com",
			"name": "بانکمون",
			"legalName": "بانکمون",
			"logo": utils.cdn('/img/logo-black.svg'),
			"contactPoint": [{
				"@type": "ContactPoint",
				"telephone": "+98",
				"contactType": "customer service",
				"availableLanguage": [
					"English",
					"Persian"
				]
			}],
			"address": {
				"@type": "PostalAddress",
				"addressLocality": "Esfahan",
				"addressCountry": "IR",
				"streetAddress": "اصفهان، شهرضا، خیابان حافظ شرقی، خیابان بهار"
			},
			"sameAs": [
				"https://facebook.com/bankemoon",
				"https://twitter.com/bankemoon",
				"https://instagram.com/bankemoon",
				"https://plus.google.com/+bankemoon",
				"https://t.me/bankemoon"
			]
		};

		return {
			structuredData,
			title,
			description,
			canonical: '/',
		}
	}

	componentDidMount = () => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js")
				.then(registration => 
					registration.onupdatefound = () => {
						const installingWorker = registration.installing;
						installingWorker.onstatechange = () => {
							if (installingWorker.state === 'installed') {
								if (navigator.serviceWorker.controller) {
									// At this point, the old content will have been purged and
									// the fresh content will have been added to the cache.
									// It's the perfect time to display a "New content is
									// available; please refresh." message in your web app.
									console.log('New content is available; please refresh.');
								} else {
									// At this point, everything has been precached.
									// It's the perfect time to display a
									// "Content is cached for offline use." message.
									console.log('Content is cached for offline use.');
								}
							}
						};
				})
				.catch(err => console.error("Service worker registration failed", err));
		} else {
			console.log("Service worker not supported");
		}
		let options = {
			typeSpeed: 60,
			backSpeed: 25,
			backDelay: 1500,
			loop: true,
			stringsElement: '#typed-strings',
		};
		this.Typed = new Typed('#desc-short', options);
	};

	handleScroll = () => {
		document.getElementsByTagName('main')[0]
			.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	render(){
		return(
			<div id='homepage'>
				<Meta {...this.props} stripTitle />

				<div className='header shadow front-header'>
					<img src={utils.cdn("/img/header-frontpage.svg")} alt='تصویر هدر' style={{ minHeight: 300, height: '101vh' }}/>

					<div id='desc' className='container'>
						<div className='text-right'>
							<h2><Tag href='/'>مدیریت قرض‌الحسنه خانوادگی و فامیلی</Tag> <Tag href='/'>بانکمون</Tag></h2>
							<p style={{ marginBottom: 4, marginTop: 16 }}>اولین <Tag noStyle href='/'>مدیریت قرض‌الحسنه‌ی کاملا اینترنتی</Tag></p>
							<p>
								و با <span className='text-white' id='desc-short'></span>
							</p>
							<div id='typed-strings' style={{ opacity: 0 }}>
								<p>مدیریت حساب توسط کاربران</p>
								<p>پشتیبانی کامل از تلفن‌های همراه</p>
								<p>نیاز به حداقل سرعت اینترنت</p>
								<p>درگاه واریز وجه اینترنتی به قرض‌الحسنه</p>
							</div>
						</div>
					</div>

					<div className='scroll-outer' onClick={this.handleScroll}>
						<div className='scroll-inner'>
							<span />
						</div>
					</div>
				</div>

				<main>
					<div className='container'>
						<section className='mt-5'>
							<header className='h3 text-center'>
								<span className="badge badge-header">بانکمون چیه دیگه؟</span>
							</header>

							<div>
								<p className='text-center mt-4 mb-4 badge-desc'>
									<span className='d-block mb-2'>
										<Tag href='/'>بانکمون</Tag> یه سایت خیلی حرفه‌ای برای مدیریت <Tag href='/'>قرض‌الحسنه‌ی</Tag> تموم خونواده‌هاست
									</span>
									<span>
										توی <Tag href='/'>بانکمون</Tag> می‌تونید
									</span>
								</p>
							</div>
							<div className='row'>
								<Card
									icon={<i className='fas fa-address-card'></i>}
									text={<span>برای تموم اعضا حساب بسازید و<br/>اطلاعات <Tag href='/'>قرض‌الحسنه</Tag> رو وارد کنید</span>}
									iconStyle={{background: '#b9ffc8', color: '#06730a'}}
								/>
								<Card
									icon={<i className='fas fa-chart-bar'></i>}
									text={<span>دریافت، پرداخت و سرمایه هر نفر رو<br/>به صورت جدا <Tag href='/'>مدیریت</Tag> کنید</span>}
									iconStyle={{background: '#fdf', color: '#626'}}
								/>
								<Card
									icon={<i className='fas fa-stopwatch'></i>}
									text={<span><Tag href='/'>وام‌های معوقه</Tag> رو ببینید و<br/>به صاحب وام تذکر بدید</span>}
									iconStyle={{background: '#fdd', color: '#bb2323'}}
								/>
								<Card
									icon={<i className='fas fa-credit-card'></i>}
									text={<span>دریافت اقساط و سپرده ماهیانه رو<br/>با <Tag href='/'>درگاه پرداخت اینترنتی</Tag> انجام بدید</span>}
									iconStyle={{background: '#ffd485', color: '#8c4e02'}}
								/>
								<Card
									icon={<i className='fas fa-sign-out-alt'></i>}
									text={<span>از تمامی <Tag href='/'>تراکنش‌ها</Tag> به  صورت تک‌تک<br/><Tag href='/'>خروجی</Tag> بگیرید</span>}
									iconStyle={{background: '#dde0ff', color: '#0259c5'}}
								/>
								<Card
									icon={<i className='fas fa-users'></i>}
									text={<span>حتی توی <Tag href='/'>قرض‌الحسنه‌های</Tag> دیگه حساب باز کنید<br/>و از مزایاشون بهره ببرید</span>}
									iconStyle={{background: '#d2ffff', color: '#177b69'}}
								/>
							</div>
						</section>

						<section className='mt-5'>
							<header className='h3 text-center'>
								<span className="badge badge-header">چیز دیگه‌ای هم به بانکمون اضافه میشه؟</span>
							</header>
							<div>
								<p className='text-center mt-4 mb-4 badge-desc'>
									از طریق نمودار زیر می‌تونید تمامی کار‌های تکمیل شده و در حال انجام رو مشاهده کنید
									<span className='d-block my-3'>همچنین تمامی بروزرسانی‌ها در بخش <Tag href='/blog/news/'>اخبار</Tag> اعلام خواهد شد</span>
								</p>
								<Stepper
									className='m-auto'
									steps={steps}
									active={1}
								/>
							</div>
						</section>
					</div>

						<section className='mt-5' style={{ background: `url(${utils.cdn("/img/charity.jpg")}) fixed no-repeat top center`, backgroundSize: 'cover' }}>
							<div className='container py-5 clearfix'>
								<p className='text-justify p-4 text-white float-left w-xs-100' style={{ background: 'rgba(4,4,33,0.7)', direction: 'rtl', width: 350, fontSize: '1.2rem', lineHeight: '2.1rem' }}>
									هدف ما در <Tag href='/' style={{color: '#fff'}}>بانکمون</Tag> اینه که بتونیم تمامی امکانات مورد نیاز یک <Tag href='/' style={{color:'#fff'}}>قرض‌الحسنه</Tag> رو فراهم کنیم
									تا کمک به افراد فامیل از طریق دادن وام و مدیریت بر مسائل اقتصادیشون ساده‌تر بشه.<br/>
									با امید به اینکه از طریق راه‌اندازی <Tag href='/' style={{color:'#fff'}}>قرض‌الحسنه‌های خانوادگی</Tag> بیشتر، بتونیم بیشتر به همدیگه کمک کنیم
								</p>
							</div>
						</section>

						<section className='pt-5 pb-5 gradient'>
							<header className='h3 text-center'>
								<span className="badge badge-header">چجوری قرض‌الحسنه بسازم؟</span>
							</header>
							<div>
								<p style={{lineHeight: '2.5rem'}} className='text-center mt-4 mb-4 px-3 badge-desc'>
									<span className='d-block mb-3'>عضویت توی <Tag href='/'>بانکمون</Tag> و ساخت <Tag href='/'>قرض‌الحسنه</Tag> خیلی ساده‌ست</span>
									<span className='d-block mb-3'>فقط کافیه از طریق دکمه‌ی <a className='btn btn-success' rel='index,follow' href='/portal/'>ورود به سامانه</a> عضو سامانه‌ی <Tag href='/'>بانکمون</Tag> بشید</span>
									<span className='d-block mb-3'>بعد از ورود اگه با مشکلی مواجه شدید، آموزش بخش‌های مختلف رو می‌تونید از قسمت <Tag href='/blog/tutorials/'>آموزش</Tag> مطالعه کنید</span>
									<span className='d-block mb-3'>باز هم اگه با مشکلی مواجه شدید یا سوالی داشتید، <a className='btn btn-info' href='/contact/'>با ما تماس</a> بگیرید</span>
									<span className='d-block'>ما همیشه برای پاسخگویی حاضریم</span>
								</p>
							</div>
						</section>
				</main>
			</div>
		);
	}
}

export default Home;
