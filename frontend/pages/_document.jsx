import Document, { Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
	static async getInitialProps({ renderPage }) {
		let structuredData = {};
		let title = '';
		let description = '';
		let canonical = '';
		const page = renderPage(App => props => {
			title = props.title;
			description = props.description;
			canonical = props.canonical;
			structuredData = props.structuredData;
			return <App {...props} />;
		});
		return {...page, structuredData, title, description, canonical };
	}

	render() {
		let {
			title,
			description,
			canonical,
			structuredData
		} = this.props;

		title = title ? (title.search('بانکمون') === -1 ? title + ' | بانکمون' : title) : 'بانکمون';
		canonical = canonical || '/';
		description = description || 'سامانه اینترنتی بانکمون برای مدیریت قرض الحسنه های خانوادگی و فامیلی قابل نصب برروی تمامی سیستم عامل ها و دارای درگاه پرداخت اینترنتی برای واریز وجه به حساب قرض الحسنه شما به صورت رایگان';
		const keywords = (structuredData && structuredData.keywords) || 'مدیریت قرض الحسنه,قرض الحسنه فامیلی,قرض الحسنه خانوادگی,قرض الحسنه فامیلی موبایل,قرض الحسنه فامیلی اندروید,قرض الحسنه فامیلی آیفون,قرض الحسنه فامیلی اینترنتی';
		return (
			<html dir='rtl' lang='fa'>
				<head>
					<meta charSet="utf-8"/>
					<script dangerouslySetInnerHTML={{ __html:`
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('js', new Date());
						gtag('config', 'UA-125587821-1');
					`}}></script>
					<meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
					<meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, shrink-to-fit=no"/>
					<meta name="fontiran.com:license" content="UD4SL"/>
					<title>{title}</title>
					<meta className='next-head' key='title' name='title' content={title} />
					<meta className='next-head' key='description' name='description' content={description} />
					<link className='next-head' key='canonical' rel='canonical' href={`https://bankemoon.com${canonical}`} />
					<meta className='next-head' key='keywords' name='keywords' content={keywords} />

					{/* FAVICON */}
					<link rel="shortcut icon" href="/favicon.ico" />
					<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
					<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
					<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
					<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
					<meta name="msapplication-TileColor" content="#da532c" />
					<meta name="theme-color" content="#ffffff" />
					<meta name="apple-mobile-web-app-capable" content="yes"/>
					<meta name="apple-mobile-web-app-status-bar-style" content="black"/>
					<link rel="manifest" href={`${process.env.REACT_APP_CDN}/manifest.json`} />

					{/* TWITTER */}
					<meta name="twitter:card" content={description} />
					<meta name="twitter:site" content="@bankemoon" />
					<meta name="twitter:title" content={title} />
					<meta name="twitter:description" content={description} />
					<meta name="twitter:creator" content="@bankemoon" />
					<meta name="twitter:image" content={`${process.env.REACT_APP_CDN}/img/og-image.jpg`} />

					{/*FACE BOOK*/}
					<meta property="og:image" content={`${process.env.REACT_APP_CDN}/img/og-image.jpg`} />
					<meta property="og:image:width" content="1383" />
					<meta property="og:image:height" content="724" />
					<meta property="og:site_name" content="بانکمون" />
					<meta property="og:title" content={title} />
					<meta property="og:type" content="website" />
					<meta property="og:description" content={description} />
					<meta property="og:url" content={`https://bankemoon.com${canonical}`} />

					<link rel='stylesheet' href={process.env.NODE_ENV === 'production'
							? 'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css'
							: `${process.env.REACT_APP_CDN}/css/bootstrap.min.css`} />
					<link rel='stylesheet' href={`${process.env.REACT_APP_CDN}/css/fonts.css`} />
					<link rel='stylesheet' href={`${process.env.REACT_APP_CDN}/css/main.min.css#cab59de458d8bacf0f4515e329dfb36d4fccb5841159a8bc64c13784cc5def60`} />
					<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.2.0/css/all.css" integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" crossOrigin="anonymous"/>
					<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
					{structuredData && Object.keys(structuredData).length > 0 &&
						<script className='next-head' key='structuredData' type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}></script>
					}

					{/* Google Tag Manager */}
					<script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
					new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
					j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
					'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
					})(window,document,'script','dataLayer','GTM-PJZ56Z8');`}}></script>

				</head>
				<body>
					<Main />
					<NextScript />
					<script async src={process.env.NODE_ENV === 'production'
							? 'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js'
							: `${process.env.REACT_APP_CDN}/js/bootstrap.min.js`}></script>
				</body>
			</html>
		)
	}
}
