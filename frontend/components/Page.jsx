import Error from './Error';
import Tag from './Tag';
import Meta from './Meta';
import utils from '../utils';

export default props => {
	return (
	<div>
		<Meta {...props} />

		<div style={{ overflow: 'hidden' }}>
			<img src={utils.cdn("/img/header.svg")} alt='تصویر هدر' style={{ minHeight: 300, height: '100%' }}/>
		</div>

		<main className={`pb-5 gradient ${props.className}`}>
			<div className='container page'>
				{props.title && !props.hideTitle && 
					<a className='tag' href={props.canonical} rel='canonical'>
						<h2>{props.title}</h2>
					</a>
				}
				{props.error
					? <Error error={props.error} />
					: props.children
				}
			</div>
		</main>
	</div>
);
}
