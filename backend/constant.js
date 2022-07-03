const tablePREFIX = 'li_';

module.exports = {
	ROLE							: 'role',
	name: {
		en: 'Bankemoon',
		fa: 'بانکمون',
	},
	options: {
		AVATAR : 'avatar',
	},
	tables: {
		CONTACTS				 : tablePREFIX + 'contacts',
		FILES						 : tablePREFIX + 'files',
		POSTS						 : tablePREFIX + 'posts',
		POSTSOPT				 : tablePREFIX + 'posts_option',
		COMMENTS				 : tablePREFIX + 'comments',
		POSTSCOMMENTS		 : tablePREFIX + 'posts_comments',
		BANKS						 : tablePREFIX + 'banks',
		BANKSOPT				 : tablePREFIX + 'banks_option',
		BANKSREQUESTS		 : tablePREFIX + 'banks_requests',
		USERSOPT				 : tablePREFIX + 'users_option',
		USERS						 : tablePREFIX + 'users',
		BANKSUSERS			 : tablePREFIX + 'banks_users',
		BANKSUSERSOPT		 : tablePREFIX + 'banks_users_option',
		BANKSUSERSSEARCH : tablePREFIX + 'banks_users_search',
		INSTALMENTS			 : tablePREFIX + 'instalments',
		INSTALMENTSOPT	 : tablePREFIX + 'instalments_option',
		TRANSACTIONS		 : tablePREFIX + 'transactions',
		TRANSACTIONSOPT  : tablePREFIX + 'transactions_option',
		FACTORS					 : tablePREFIX + 'factors',
		CAPTCHA					 : tablePREFIX + 'captcha',
		SESSIONS				 : tablePREFIX + 'sessions',
		DEVICES					 : tablePREFIX + 'devices',
		MESSAGES				 : tablePREFIX + 'messages',
		MESSAGESUSERS		 : tablePREFIX + 'messages_users',
		TICKETS					 : tablePREFIX + 'tickets',
		TICKETSMESSAGES  : tablePREFIX + 'tickets_messages',
		OPT							 : tablePREFIX + 'options',
		STATUS					 : tablePREFIX + 'status',
		DEPARTMENTS			 : tablePREFIX + 'departments',
		ROLES						 : tablePREFIX + 'roles',
		TYPES						 : tablePREFIX + 'types',
		LOGS						 : tablePREFIX + 'logs',
	},
	banks: {
		FULLYPAIDLOAN_COUNT: 'fpl_co',
		TRANSACTION_COUNT: 't_co',
		INSTALMENT_COUNT: 'i_co',
		LOAN_COUNT: 'l_co',
		ADMIN_COUNT: 'a_co',
		USER_COUNT: 'u_co',
		MESSAGE_COUNT: 'm_co',
		COUNT: 'b_co',

		PENALTY_BALANCE: 'p_ba',
		COMMISSION_BALANCE: 'c_ba',
		INSTALMENT_BALANCE: 'i_ba',
		LOAN_BALANCE: 'l_ba',
		REIMBURSEMENT: 'reim',
		BALANCE: 'b_ba',


		ADMIN: 'admin',
		badge: {
			DELAYEDLOANS: 'bg_loans', // in banks
			TRANSACTIONS: 'bg_trans', // in banks
			REQUESTS: 'bg_requests', // in banks
		},
	},
	users: {
		BALANCE: 'u_ba',
		COUNT: 'u_co',
		badge: {
			BANKS: 'bg_banks', // in users
			TICKETS: 'bg_tickets', // in users
			MESSAGES: 'bg_messages', // in users
			DELAYEDLOANS: 'bg_loans', // in users
		},
	},
	transactions: {
		FULLYPAID: 'fully_paid',
		LOAN: 'loan',
		PAYMENT: 'payment',
		INITIAL: 'initial',

		INSTALMENT: 'instalment',
		COMMISSION: 'commission',
		PENALTY: 'penalty',
	},
	role: {
		SITEADMIN: 'SiteAdmin',
		MANAGEMENT: 'Management',
		WRITER: 'Writer',

		CREATOR: 'Creator',
		BANKADMIN: 'BankAdmin',
		BANKMEMBER: 'BankMember',
		USER: 'User',
		level: {
			'SiteAdmin': 100,
			'Management': 90,
			'Creator': 70,
			'BankAdmin': 60,
			'Writer': 50,
			'BankMember': 1,
		}
	},
	department: {
		MANAGEMENT: 'Management',
		DESIGN: 'Design',
		TECHNICAL: 'Technical',
		FINANCIAL: 'Financial',
		SUGGESTIONS: 'Suggestions',
	},
	posts: {
		VISITCOUNT: 'v_co',
		COMMENTCOUNT: 'c_co',
		COUNT: 'p_co',
		COUNT_TUTORIALS: 't_co',
		COUNT_NEWS: 'n_co',
		TUTORIALS: 'Tutorials',
		NEWS: 'News',
		COMMENT_LOCK: 'c_lock'
	},
	visits: {
		TODAY: 'v_today',
		YESTERDAY: 'v_yesterday',
		LASTWEEK: 'v_last_week',
		TOTAL: 'v_total',

		ALLBANKS: 'v_all_banks',
		SEARCHBANKS: 'v_search_banks',
		BANKSUSERS: 'v_b_users',
		BANKSEXPORT: 'v_b_export',
		BANKSTRANSACTION: 'v_b_transaction',
		BANKSTRANSACTIONS: 'v_b_transactions',
		BANKSLOANS: 'v_b_loans',
		BANKSREQUESTS: 'v_b_requests',
		BANKSINVITATIONS: 'v_b_invitation',
		BANKSMESSAGES: 'v_b_message',
		BANKSEDIT: 'v_b_edit',
		BANKSPLANS: 'v_b_plans',
		MESSAGES: 'v_message',
		TICKETS: 'v_ticket',
		TUTORIAL: 'v_tutorial',
		SESSIONS: 'v_session',
		PROFILE: 'v_profile',
	},
	visitors: {
		DAILY: 'vr_daily',
		YESTERDAY: 'vr_yesterday',
		LASTWEEK: 'vr_last_week',
		TOTAL: 'vr_total',
	},
	status: {
		PENDING: 'Pending',
		ACCEPTED: 'Accepted',
		DECLINED: 'Declined',

		READED: 'Readed',
		NOTREADED: 'NotReaded',
		ANSWERED: 'Answered',
		UNANSWERED: 'UnAnswered',

		CLOSED: 'Closed',
		BANNED: 'Banned',
		DELETED: 'Deleted',

		PAYED: 'Payed',
		SENTBACK: 'SentBack',
		TRANSFERRED: 'Transferred',
	},
	memory: {
		users: {
			SNAPSHOT: 'users:snapshot',
			BADGES: 'users:badges',
		},
		banks: {
			ALL: 'banks',
			// INFO: 'banks:info',
			BADGE: 'banks:badge',
			BALANCE: 'banks:balance',
			ADMINS: 'banks:admin',
			BANKSUSERS: function(str){ return `banksUsers:${str}`; }
		},
		posts: {
			ALL: 'posts',
			COUNT: 'posts:count',
		}
	},
	persian: {
		transactions: {
			instalment: 'قسط وام',
			commission: 'کارمزد',
			penalty: 'دیرکرد',
			payment: 'سپرده',
			loan: 'وام',
			initial: 'سرمایه اولیه',
		}
	}
};

