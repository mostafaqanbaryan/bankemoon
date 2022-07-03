import utils from 'utils';

class Loan{
	constructor({ price, duration, commission, delayed, profit, penalty, createdInMonth, paidInstalment, paidPenalty, paidCommission, loanBalance }){
		this.price = parseFloat(utils.sanitize.money(price));
		this.duration = parseInt(duration, 10);
		this.delayed = parseInt(delayed, 10);
		this.penalty = parseFloat(penalty);
		this.createdInMonth = parseInt(createdInMonth, 10);
		this.paidCommission = parseFloat(paidCommission);
		this.paidPenalty = parseFloat(paidPenalty);
		this.paidInstalment = parseFloat(paidInstalment);
		this.loanBalance = parseFloat(loanBalance);
		this.instalment = this.instalmentCalc(profit);
		this.commissions = this.commissionCalc(commission);
		this.commission = this.commissions.reduce((prev, curr) => prev + curr, 0);
		this.profit = this.profitCalc();
	}

	getCommissions(){ return this.commissions; }
	getCommission(){ return this.commission; }
	getProfit(){ return this.profit; }
	getInstalment(){ return this.instalment; }
	getReimbursement(){ return Math.ceil(this.commission + this.profit + this.price); }
	getHowManyYear() {
		if(!this.createdInMonth && this.createdInMonth !== 0)
			throw new Error('تعداد ماه گذشته را وارد کنید');
		if(!this.howManyYear && this.howManyYear !== 0)
			this.howManyYear = Math.floor(this.createdInMonth / 12); // 0, 1, 2, 
		return this.howManyYear;
	}
	getDebt() {
		if(!this.delayed && this.delayed !== 0)
			throw new Error('تاخیر وارد نشده است');
		if(!this.penalty && this.penalty !== 0)
			throw new Error('دیرکرد وارد نشده است');

		return this.getUnpaidInstalment() + this.getUnpaidCommission() + this.getUnpaidPenalty();
	}
	getUnpaidPenalty(){
		return this.penalty - this.paidPenalty;
	}
	getUnpaidInstalment(){
		// return Math.round((this.getInstalment() * 10 * this.delayed / 10) * 10) / 10;
		return (Math.round((this.getInstalment() * 10 * this.createdInMonth / 10) * 10) - (this.paidInstalment*10)) / 10;
	}
	getUnpaidCommission(){
		if(!this.paidCommission && this.paidCommission !== 0)
			throw new Error('کارمزد پرداختی را وارد کنید');
		const unpaidCommission = this.getCommissionShouldBePaid() - this.paidCommission;
		return unpaidCommission > 0 ? unpaidCommission : 0;
	}

	getCommissionShouldBePaid(){
		if(!this.commissionShouldBePaid && this.commissionShouldBePaid !== 0){
			const howManyYear = this.getHowManyYear();
			this.commissionShouldBePaid = this.commissions.reduce((acc, c, i) => {
				if(i <= howManyYear)
					acc += c;
				return acc;
			}, 0);
		}
		return this.commissionShouldBePaid;
	}

	commissionCalc(commissionPercentage){
		if(!commissionPercentage && commissionPercentage !== 0)
			throw new Error('درصد کارمزد وارد نشده است');
		let dur					= this.duration;
		let years				= Math.ceil(dur/12);
		let instalment	= this.price / (dur-years);
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

	/* penaltyCalc(penaltyPercentage){
		let shouldBePaid = this.instalment * this.monthSinceCreated;
		let unpaid = shouldBePaid - this.paid;
		let delayMonth = Math.ceil(unpaid / this.instalment);
		let delayByDay = delayMonth * 30;
		if(unpaid > 0){
			// let numerator = this.instalment * penaltyPercentage * delayByDay;
			let numerator = unpaid * penaltyPercentage * delayByDay;
			let denominator = 30 * 100;
			return Math.ceil(numerator / denominator);
		}
		else
			return 0;
	} */
}

export default Loan;
