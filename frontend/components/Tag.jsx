import Link from 'next/link';

export default (props) => (
	<Link href={props.href}>
		<a
			rel='follow,index'
			className={props.noStyle ? 'no-link' : 'tag'}
			style={props.style}>
			<strong>
				{props.children}
			</strong>
		</a>
	</Link>
);
