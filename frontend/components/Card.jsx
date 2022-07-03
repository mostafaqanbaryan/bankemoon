export default props => (
	<div className='col-12 col-sm-6 col-lg-4'>
		<div className='card shadow h-card'>
			<div className='card-header-icon' style={props.iconStyle}>
				{props.icon}
			</div>
			<div className='card-body d-flex align-items-center text-center m-auto' style={props.textStyle}>
				{props.text}
			</div>
		</div>
	</div>
);

