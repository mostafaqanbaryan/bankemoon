import utils from 'utils';

it('Should return money like xxx,xxx,xxx', () => {
	const money = 1234567890;
	expect(utils.money(money)).toEqual('1,234,567,890');
});

it('Should return only numbers', () => {
	const money = '$123&gym,(*4,,,5006';
	expect(utils.sanitize.money(money)).toEqual('12345006');
});

it('Should return sanitize money', () => {
	const money = '$123&gym,(*4,,,5006';
	expect(utils.money(utils.sanitize.money(money))).toEqual('12,345,006');
});

it('Should return Commission of a Loan', () => {
	let money = 3000000;
	let percentage = 4;
	let duration = 30;
	let commission = [120000, 71112, 11112];
	expect(utils.commission(money, percentage, duration)).toEqual(commission);

	money = 500000;
	percentage = 4;
	duration = 10;
	commission = [16667];
	expect(utils.commission(money, percentage, duration)).toEqual(commission);

	money = 1000000;
	percentage = 4.7;
	duration = 20;
	commission = [47000, 12186];
	expect(utils.commission(money, percentage, duration)).toEqual(commission);
});

it('Should return Installment of a Loan', () => {
	let money = 3000000;
	let percentage = 4;
	let duration = 30;
	let installment = 105250;
	expect(utils.installment(money, percentage, duration)).toEqual(installment);

	money = 500000;
	percentage = 4;
	duration = 10;
	installment = 50922;
	expect(utils.installment(money, percentage, duration)).toEqual(installment);

	money = 1000000;
	percentage = 4.7;
	duration = 20;
	installment = 52082;
	expect(utils.installment(money, percentage, duration)).toEqual(installment);
});

it('Should return Profit of a Loan', () => {
	let money = 3000000;
	let percentage = 4;
	let duration = 30;
	let profit = 157500;
	let installment = utils.installment(money, percentage, duration);
	expect(utils.profit(money, installment, duration)).toEqual(profit);

	money = 500000;
	percentage = 4;
	duration = 10;
	profit = 9220;
	installment = utils.installment(money, percentage, duration);
	expect(utils.profit(money, installment, duration)).toEqual(profit);

	money = 1000000;
	percentage = 4.7;
	duration = 20;
	profit = 41640;
	installment = utils.installment(money, percentage, duration);
	expect(utils.profit(money, installment, duration)).toEqual(profit);
});

it('Should return Penalty of a Loan', () => {
	let money							 = 3000000;
	let percentage				 = 4;
	let penalty_percentage = 3;
	let duration					 = 30;	// Month
	let penalty_days			 = 30;	// Days
	let penalty						 = 3158;
	let installment				 = utils.installment(money, percentage, duration);
	expect(utils.penalty(installment, penalty_percentage, penalty_days)).toEqual(penalty);

	money							 = 500000;
	percentage				 = 4;
	penalty_percentage = 3;
	duration					 = 10;
	penalty_days			 = 100;
	penalty						 = 5093;
	installment				 = utils.installment(money, percentage, duration);
	expect(utils.penalty(installment, penalty_percentage, penalty_days)).toEqual(penalty);

	money							 = 1000000;
	percentage				 = 12;
	penalty_percentage = 3;
	duration					 = 20;
	penalty_days			 = 100;
	penalty						 = 5542;
	installment				 = utils.installment(money, percentage, duration);
	expect(utils.penalty(installment, penalty_percentage, penalty_days)).toEqual(penalty);
});
