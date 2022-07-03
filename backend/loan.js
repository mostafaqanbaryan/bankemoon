class Loan{
	constructor({ price, duration, commission, profit, penalty, paid, monthSinceCreated }){
		this.paid = paid; // Only instalments
		this.monthSinceCreated = monthSinceCreated;
		this.price = Math.abs(price);
		this.duration = duration;
		this.instalment = this.instalmentCalc(profit);
		this.commissions = this.commissionCalc(commission);
		this.commission = this.commissions.reduce((prev, curr) => prev + curr, 0);
		this.penalty = this.penaltyCalc(penalty);
		this.profit = this.profitCalc();
	}

	getCommissions(){ return this.commissions; }
	getCommission(){ return this.commission; }
	getProfit(){ return this.profit; }
	getInstalment(){ return this.instalment; }
	getReimbursement(){ return Math.ceil(this.commission + parseFloat(this.profit) + parseFloat(this.price)); }
	getPenalty(){ return this.penalty; }

	commissionCalc(commissionPercentage){
		let dur					= this.duration;
		let years				= Math.ceil(dur/12);
		let instalment = this.price / (dur-years);
		let commissions = [];

		for(let i = 0; i < years; i++){
			let y_pri				= this.price - (i * 11 * instalment);
			let y_dur				= dur >= 12 ? 12 : dur;
			dur							-= 12;

			let numerator		= y_pri * commissionPercentage * y_dur;
			let denominator = 1200;
			commissions.push(Math.ceil(numerator / denominator));
		}
		return commissions;
	}

	instalmentCalc(profitPercentage){
		if(profitPercentage > 0){
			let numerator		= this.price * (profitPercentage/1200) * ((1 + profitPercentage/1200) ** this.duration);
			let denominator = ((1 + profitPercentage/1200) ** this.duration) - 1;
			return Math.round(numerator / denominator * 10) / 10;
		}else{
			return Math.round(this.price / this.duration * 10) / 10;
		}
	}

	profitCalc(){
		let numerator = (this.instalment * this.duration) - this.price;
		return Math.ceil(numerator);
	}

	penaltyCalc(penaltyPercentage){
		let shouldBePaid = this.instalment * this.monthSinceCreated;
		let unpaid = shouldBePaid - this.paid;
		let delayMonth = Math.ceil(unpaid / this.instalment);
		let delayByDay = delayMonth * 30;
		console.log('AAAAAAAAA', shouldBePaid, unpaid, delayMonth, delayByDay);
		if(unpaid > 0){
			// let numerator = this.instalment * penaltyPercentage * delayByDay;
			let numerator = unpaid * penaltyPercentage * delayByDay;
			let denominator = 30 * 100;
			return Math.ceil(numerator / denominator);
		}
		else
			return 0;
	}
}

module.exports=Loan;
