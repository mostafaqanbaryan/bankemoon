dev = false;
let Canvas, Image;

if(!dev){
	Canvas = require('canvas');
	Image = Canvas.Image;
}

class Captcha{
	constructor(){
		this.text = this.rand(12148, 98742).toString();
		this.color = '#000';
		this.height = 50;
		this.width = 125;

		this.create();
		this.ctx.beginPath();
		this.addText();
		this.addBackground();
		this.addShapes();
	}

	create(){
		if(dev) {
			this.canvas = document.createElement('canvas');
		}
		else
			this.canvas = new Canvas(this.width, this.height);
		this.ctx = this.canvas.getContext('2d');
		this.ctx.canvas.width = this.width;
		this.ctx.canvas.height = this.height;
	}

	addText(){
		// Text
		let font = this.getRandomFont();
		let size = this.getRandomSize();
		this.ctx.font = `italic ${size}pt ${font}`;
		// let x = this.rand(0, 15);
		let x = this.rand(0);
		let y = this.rand(25, 45);

		// Add Space
		let text = this.text;
		text = this.addSpace(text);
		if(font !== 'Courier')
			text = this.addSpace(text);

		this.ctx.fillText(text, x, y);
	}

	addSpace(text){
		let t = text.split('');
		let i = this.rand(1, t.length-2);
		t.splice(i, 0, ' ');
		t = t.join('');
		return t;
	}
	getRandomFont(){
		let fonts = [
			'calibri',
			'arial',
			'Helvetica',
			'Times New Roman',
			'Times',
			'Courier New',
			'Courier',
			'Verdana',
			'Georgia',
			'Palatino',
			'Garamond',
			'Bookman',
			'Comic Sans MS',
			'Trebuchet MS',
			'Arial Black',
			'Impact',
		];
		let i = this.rand(0, fonts.length-1);
		return fonts[i];
	}

	getRandomSize(){
		return this.rand(22, 25);
	}

	addBackground(){
		let pattern = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAABHNCSVQICAgIfAhkiAAAACRJREFUCFtjZMAE/xnRxP4D+YzIgmABkCKYIEwArhKuAmrUfwAbSQcEy9y90wAAAABJRU5ErkJggg==';
		let img;
		if(dev)
			img = document.createElement('img');
		else
			img = new Image();
		img.src = pattern;
		let pat = this.ctx.createPattern(img, 'repeat');
		this.ctx.fillStyle = pat;
		this.ctx.fillStyle = pat;
		this.ctx.fillRect(0, 0, this.width, this.height);
	}

	addShapes(){
		// Lines
		this.line(this.ctx, 3);
		// this.line(this.ctx, 2);

		// Circles
		this.circle(this.ctx, this.rand(5, 30));
	}

	getText(){
		return this.text;
	}

	getUrl(){
		let url = this.canvas.toDataURL();
		return url;
	}

	rand(min, max){
		return Math.floor(Math.random() * (max-min) + (min));
	}

	line(ctx, lwidth){
		let xm = 0 + this.rand(0, this.width/2);
		let ym = 0 + this.rand(0, this.height/3);
		let xl = xm + this.rand(20, this.width);
		let yl = ym + this.rand(10, this.height);
		/* ctx.moveTo(rand(10, 75), rand(5,30));
		ctx.lineTo(rand(10, 75), rand(5,30)); */
		ctx.moveTo(xm, ym);
		ctx.lineTo(xl, yl);
		ctx.lineWidth = lwidth;
		ctx.stroke();
	}

	circle(ctx, radius){
		let x = this.rand(radius, this.width -radius);
		let y = this.rand(radius, this.height -radius);
		ctx.moveTo(x, y);
		ctx.arc(
			x,
			y,
			radius,
			0,
			2*Math.PI,
			false);
		// ctx.fill();
		ctx.lineWidth = 2;
		ctx.stroke();
	}
}

module.exports = Captcha;
