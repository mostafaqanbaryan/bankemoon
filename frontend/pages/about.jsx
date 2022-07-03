import Tag from '../components/Tag';
import Page from '../components/Page';

export default class About extends React.Component{
	static getInitialProps(){
		const title = 'درباره ما';
		const description = 'توضیاحت مربوط به طراحی و ساخت سامانه اینترنتی مدیریت قرض الحسنه بانکمون توسط گروه برنامه نویسی اپیست';
		const canonical = '/about/';
		const structuredData = {
			"@context": "http://schema.org",
			"@type": "AboutPage",
			"url": `https://bankemoon.com${canonical}`,
			"name": title + ' بانکمون',
			"about": "About page of Website",
			"creator": {
				"@type": "Organization",
				"name": "بانکمون"
			},
			"mainContentOfPage": '.page',
			"relatedLink": "https://bankemoon.com/portal/",
			"significantLink": "https://bankemoon.com/portal/",
			"keywords": "درباره,درباره ما,درباره بانکمون,بانکمون"
		};

		return {
			structuredData,
			title,
			description,
			canonical,
		};
	}

	render(){
		return(
			<Page {...this.props}>
				<p className='w-text-500 text-justify'>
					<span className='d-block'>
						<Tag href='/'>بانکمون</Tag> توسط <Tag href='https://appist.ir/'>گروه برنامه‌نویسی اپیست</Tag> با مدیریت <strong>مصطفی قنبریان</strong> طراحی و ساخته شده تا نیاز به دفاتر، نرم‌افزار‌ها و سیستم‌عامل‌های خاص رو از سر راه برداره و همیشه و در همه‌جا در دسترس همه‌ی افراد باشه.
					</span>
					<span className='d-block'>
						<Tag href='/'>بانکمون</Tag> صرفا یک سامانه‌ی مدیریتی برای ثبت وقایع <Tag href='/'>قرض‌الحسنه‌ی</Tag> شماست و به خودی خود هیچ ماهیت بانکی و قرض‌الحسنه‌ای نداره.
					</span>

					<span className='d-block'>
						چیزی که <Tag href='/'>بانکمون</Tag> رو از نرم‌افزارهای دیگه جدا می‌کنه اینه که دسترسی کامل به صاحب <Tag href='/'>قرض‌الحسنه</Tag> و همچنین تک‌تک صاحبین حساب میده تا از همه‌ی حساب‌ها آگاه باشند و بتونند به صورت <Tag href='/'>اینترنتی</Tag> پول واریز یا برداشت کنند و در قرض‌الحسنه‌ها عضو بشند و ... هزارتا کار دیگه که خودتون <Tag href='/portal/'>باید ببینید</Tag>!
					</span>

					<span className='d-block'>
						درصورتی که هر سوالی در زمینه‌های مختلف داشتید، می‌تونید <Tag href='/contact/'>با ما تماس</Tag> بگیرید.
					</span>
				</p>
			</Page>
		);
	}
}
