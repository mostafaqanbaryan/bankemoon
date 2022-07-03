const db			 = require('./db');
const config	 = require('config');
const constant = require('./constant');
const bunyan	 = require('bunyan');
const log			 = bunyan.createLogger({name: config.get('TITLE'), src: true});
let query			 = [];

/*
 * Dont forget to REINDEX after some time;
 * Create another INDEX with CONCURRENTLY, So writes don't get blocked
 * Then remove old INDEX
 */

query.push(`CREATE OR REPLACE FUNCTION delete_admin_privileges()
	RETURNS TRIGGER AS $$
	BEGIN
		DELETE FROM ${constant.tables.TICKETSMESSAGES} WHERE admin_id=OLD.user_id;
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION check_admin_privileges()
	RETURNS TRIGGER AS $$
	BEGIN
		IF(SELECT 1 FROM ${constant.tables.USERSOPT} WHERE user_id=NEW.admin_id AND key='${constant.ROLE}' AND value::smallint > 0) 
		THEN RETURN NEW;
		ELSE RAISE EXCEPTION 'شماره کاربری متعلق به مدیر نیست' USING DETAIL='403';
		END IF;
	END;
	$$ language 'plpgsql';
`);

// Create Function update_at
query.push(`CREATE OR REPLACE FUNCTION update_updateat_column()
	RETURNS TRIGGER AS $$
	BEGIN
		NEW.updated_at = now();
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION increase_bank_user_count()
	RETURNS TRIGGER AS $$
	BEGIN
		IF(TG_TABLE_NAME='${constant.tables.BANKSUSERS}') THEN
			-- Increase Count
			INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES (NEW.bank_id, '${constant.banks.USER_COUNT}', 1)
			ON CONFLICT(bank_id, key) DO UPDATE SET value=(${constant.tables.BANKSOPT}.value::integer+1);

			-- Add Bank to userOption
			INSERT INTO ${constant.tables.USERSOPT} (user_id, key, value) VALUES (NEW.user_id, 'banks', ARRAY[NEW.bank_id])
			ON CONFLICT(user_id, key) DO UPDATE SET value=array_append(${constant.tables.USERSOPT}.value::integer[], NEW.bank_id)::text;
		END IF;
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION decrease_bank_user_count()
	RETURNS TRIGGER AS $$
	DECLARE
		Exists SMALLINT;
	BEGIN
		SELECT COALESCE(2, 1) INTO Exists FROM ${constant.tables.BANKSUSERSOPT} WHERE bank_user_id=OLD.id AND key='status' LIMIT 1;
		RAISE NOTICE 'Decrease BankUser Count %', Exists;
		IF Exists THEN
			Exists := 0;
		ELSE
			Exists := 1;
		END IF;
		UPDATE ${constant.tables.BANKSOPT} SET value=(${constant.tables.BANKSOPT}.value::integer-Exists)
		 WHERE bank_id=OLD.bank_id AND key='${constant.banks.USER_COUNT}';

		-- Remove Bank from userOption
		UPDATE ${constant.tables.USERSOPT} SET value=array_remove(${constant.tables.USERSOPT}.value::integer[], OLD.bank_id)
			WHERE user_id=OLD.user_id AND key='banks';

		-- Decrease BankSearch subsetCount
		IF(OLD.parent_id IS DISTINCT FROM NULL) THEN
			UPDATE ${constant.tables.BANKSUSERSSEARCH} SET subset_count=${constant.tables.BANKSUSERSSEARCH}.subset_count::integer-1
				WHERE user_id=OLD.parent_id AND bank_id=OLD.bank_id;
		END IF;
		RETURN OLD;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION increase_bank_user_count_on_status()
	RETURNS TRIGGER AS $$
	BEGIN
		-- Update userCount
		INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES (OLD.bank_id, '${constant.banks.USER_COUNT}', 1)
			ON CONFLICT(bank_id, key) DO UPDATE SET value=(${constant.tables.BANKSOPT}.value::integer+1);

		-- Update requestUser badge
		UPDATE ${constant.tables.BANKSOPT} SET value=(${constant.tables.BANKSOPT}.value::integer-1)
			WHERE key='${constant.banks.badge.REQUESTS}' AND bank_id=OLD.bank_id;

		IF(TG_OP='UPDATE') THEN
			RETURN NEW;
		ELSE
			RETURN OLD;
		END IF;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION decrease_bank_user_count_on_status()
	RETURNS TRIGGER AS $$
	BEGIN
		-- Update userCount
		UPDATE ${constant.tables.BANKSOPT} SET value=(${constant.tables.BANKSOPT}.value::integer-1)
			WHERE key='${constant.banks.USER_COUNT}' AND bank_id=NEW.bank_id;

		-- Update requestUser badge
		INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES (NEW.bank_id, '${constant.banks.badge.REQUESTS}', 1)
			ON CONFLICT(bank_id, key) DO UPDATE SET value=(${constant.tables.BANKSOPT}.value::integer+1);

		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION add_user_to_search()
	RETURNS TRIGGER AS $$
	DECLARE
		status_text TEXT;
		role_text TEXT;
	BEGIN
		SELECT label INTO status_text FROM ${constant.tables.STATUS} WHERE id=NEW.status LIMIT 1;
		SELECT label INTO role_text FROM ${constant.tables.ROLES} WHERE id=NEW.role LIMIT 1;
		INSERT INTO ${constant.tables.BANKSUSERSSEARCH}
			(bank_id, user_id, parent_id, bank_user_id, full_name, username, phone, status, role)
			SELECT
				NEW.bank_id,
				NEW.user_id,
				NEW.parent_id,
				NEW.id,
				CONCAT(first_name, ' ', last_name),
				username,
				phone,
				status_text,
				role_text
			FROM ${constant.tables.USERS} WHERE id=NEW.user_id LIMIT 1
		ON CONFLICT(bank_user_id) DO UPDATE SET
			parent_id=EXCLUDED.parent_id,
			status=EXCLUDED.status,
			role=EXCLUDED.role,
			full_name=EXCLUDED.full_name,
			phone=EXCLUDED.phone;

		IF(TG_OP='UPDATE' AND OLD.parent_id IS DISTINCT FROM NULL AND OLD.parent_id > 0) THEN
			UPDATE ${constant.tables.BANKSUSERSSEARCH} SET subset_count=COALESCE(subset_count, 1)-1 WHERE user_id=OLD.parent_id AND bank_id=OLD.bank_id;
		END IF;
		IF(NEW.parent_id IS DISTINCT FROM NULL AND NEW.parent_id > 0) THEN
			UPDATE ${constant.tables.BANKSUSERSSEARCH} SET subset_count=COALESCE(subset_count, 0)+1 WHERE user_id=NEW.parent_id AND bank_id=NEW.bank_id;
		END IF;
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION update_user_update_search()
	RETURNS TRIGGER AS $$
	BEGIN
		UPDATE ${constant.tables.BANKSUSERSSEARCH} SET
			full_name=CONCAT(NEW.first_name, ' ', NEW.last_name),
			username=NEW.username,
			phone=NEW.phone
		WHERE user_id=NEW.id;
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION increase_bank_admin_count()
	RETURNS TRIGGER AS $$
	BEGIN
		IF(TG_TABLE_NAME='${constant.tables.BANKSUSERS}') THEN
			INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES (NEW.bank_id, '${constant.banks.ADMIN_COUNT}', 1)
			ON CONFLICT(bank_id, key) DO UPDATE SET value=(${constant.tables.BANKSOPT}.value::integer+1);
		END IF;
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION decrease_bank_admin_count()
	RETURNS TRIGGER AS $$
	BEGIN
			UPDATE ${constant.tables.BANKSOPT} SET value=(${constant.tables.BANKSOPT}.value::integer-1)
			 WHERE bank_id=OLD.bank_id AND key='${constant.banks.ADMIN_COUNT}';
		RETURN OLD;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION increase_fully_paid_loan()
	RETURNS TRIGGER AS $$
	DECLARE
		bankId INT;
	BEGIN
		SELECT BANKSUSERS.bank_id INTO bankId
			FROM ${constant.tables.TRANSACTIONS} AS TRANSACTIONS
		INNER JOIN ${constant.tables.BANKSUSERS} AS BANKSUSERS
			ON BANKSUSERS.id = TRANSACTIONS.bank_user_id
		WHERE
			TRANSACTIONS.id=NEW.transaction_id
		LIMIT 1;

		INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value)
			VALUES (bankId, '${constant.banks.FULLYPAIDLOAN_COUNT}', 1)
		ON CONFLICT(bank_id, key) DO UPDATE SET value=(${constant.tables.BANKSOPT}.value::integer+1);
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION decrease_fully_paid_loan()
	RETURNS TRIGGER AS $$
	DECLARE
		bankId INT;
	BEGIN
		SELECT BANKSUSERS.bank_id INTO bankId
			FROM ${constant.tables.TRANSACTIONS} AS TRANSACTIONS
		INNER JOIN ${constant.tables.BANKSUSERS} AS BANKSUSERS
			ON BANKSUSERS.id = TRANSACTIONS.bank_user_id
		WHERE
			TRANSACTIONS.id=OLD.transaction_id
		LIMIT 1;

		UPDATE ${constant.tables.BANKSOPT} SET value=(${constant.tables.BANKSOPT}.value::integer-1)
			WHERE key='${constant.banks.FULLYPAIDLOAN_COUNT}' AND bank_id=bankId;
		RETURN OLD;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION add_transaction_value()
	RETURNS TRIGGER AS $$
	DECLARE
		bankId int;
		userId int;
		type_name TEXT;
		instalment FLOAT;
		instalmentPaid FLOAT;
	BEGIN
		SELECT label INTO type_name FROM ${constant.tables.TYPES} WHERE id=NEW.type LIMIT 1;
		SELECT bank_id, user_id INTO bankId, userId FROM ${constant.tables.BANKSUSERS} WHERE id=NEW.bank_user_id LIMIT 1;

		-- Increase Balance on bank
		INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES
			(bankId, '${constant.banks.BALANCE}', NEW.value::float) 
		ON CONFLICT(bank_id, key) DO UPDATE SET value=(ROUND(CAST(${constant.tables.BANKSOPT}.value::float+NEW.value::float AS numeric), 2)); 

		-- Increase Balance on user
		INSERT INTO ${constant.tables.BANKSUSERSOPT} (bank_user_id, key, value) VALUES
			(NEW.bank_user_id, '${constant.users.BALANCE}', NEW.value::float) 
		ON CONFLICT(bank_user_id, key) DO UPDATE SET value=(ROUND(CAST(${constant.tables.BANKSUSERSOPT}.value::float+NEW.value::float AS numeric), 2));

		-- Increase count on bank
		INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES (bankId, '${constant.banks.TRANSACTION_COUNT}', 1)
		ON CONFLICT(bank_id, key) DO UPDATE SET value=(${constant.tables.BANKSOPT}.value::INTEGER+1);

		IF(type_name = '${constant.transactions.LOAN}') THEN
			-- Increase Loan count on bank
			INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES
				(bankId, '${constant.banks.LOAN_COUNT}', 1)
			ON CONFLICT(bank_id, key) DO UPDATE SET value=(${constant.tables.BANKSOPT}.value::INTEGER+1);

			-- Increase Loan count on user
			INSERT INTO ${constant.tables.BANKSUSERSOPT} (bank_user_id, key, value) VALUES
				(NEW.bank_user_id, '${constant.banks.LOAN_COUNT}', 1)
			ON CONFLICT(bank_user_id, key) DO UPDATE SET value=(${constant.tables.BANKSUSERSOPT}.value::INTEGER+1);

		ELSEIF(NEW.parent_id IS DISTINCT FROM NULL) THEN
			-- Increase Balance for Loan
			INSERT INTO ${constant.tables.TRANSACTIONSOPT} (transaction_id, key, value) VALUES
				(NEW.parent_id, '${constant.banks.LOAN_BALANCE}', NEW.value::float) 
			ON CONFLICT(transaction_id, key) DO UPDATE SET value=(ROUND(CAST(${constant.tables.TRANSACTIONSOPT}.value::float+NEW.value::float AS numeric), 1)); 

			-- Increase Balance for TYPE on loan
			INSERT INTO ${constant.tables.TRANSACTIONSOPT} (transaction_id, key, value) VALUES
				(NEW.parent_id, CONCAT(SUBSTR(type_name, 1, 1), '_ba'), NEW.value::float) 
			ON CONFLICT(transaction_id, key) DO UPDATE SET value=(ROUND(CAST(${constant.tables.TRANSACTIONSOPT}.value::float+NEW.value::float AS numeric), 1)); 

			-- Increase Balance for TYPE on bank
			INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES
				(bankId, CONCAT(SUBSTR(type_name, 1, 1), '_ba'), NEW.value::float) 
			ON CONFLICT(bank_id, key) DO UPDATE SET value=(ROUND(CAST(${constant.tables.BANKSOPT}.value::float+NEW.value::float AS numeric), 1)); 

			-- Increase count on bank
			--INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES (bankId, '${constant.banks.TRANSACTION_COUNT}', 1)
			--ON CONFLICT(bank_id, key) DO UPDATE SET value=(${constant.tables.BANKSOPT}.value::INTEGER+1);

			-- Increase Instalment for Loan on bank
			IF(type_name = 'instalment') THEN
				SELECT value INTO instalment FROM ${constant.tables.TRANSACTIONSOPT}
					WHERE transaction_id=NEW.parent_id AND key='instalment' LIMIT 1;
				SELECT value INTO instalmentPaid FROM ${constant.tables.TRANSACTIONSOPT}
					WHERE transaction_id=NEW.parent_id AND key='${constant.banks.INSTALMENT_BALANCE}' LIMIT 1;
				INSERT INTO ${constant.tables.TRANSACTIONSOPT} (transaction_id, key, value) VALUES
					(NEW.parent_id, '${constant.banks.INSTALMENT_COUNT}', ROUND(instalmentPaid/instalment))
				ON CONFLICT(transaction_id, key) DO UPDATE SET value=EXCLUDED.value;
			END IF;
		END IF;

		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION update_transaction_value()
	RETURNS TRIGGER AS $$
	DECLARE
		bankId int;
		userId int;
	BEGIN
		RETURN NULL;



		IF OLD.parent_id <> NEW.parent_id THEN
			RAISE EXCEPTION 'امکان تغییر وام وجود ندارد' USING DETAIL='403';
		END IF;
		IF OLD.bank_user_id <> NEW.bank_user_id THEN
			RAISE EXCEPTION 'امکان تغییر بانک یا کاربر وجود ندارد' USING DETAIL='403';
		END IF;
		IF OLD.type <> NEW.type THEN
			RAISE EXCEPTION 'امکان تغییر نوع تراکنش وجود ندارد' USING DETAIL='403';
		END IF;
		SELECT bank_id, user_id INTO bankId, userId FROM ${constant.tables.BANKSUSERS} WHERE id=NEW.bank_user_id LIMIT 1;

		-- Increase/Decrease Balance on bank
		UPDATE ${constant.tables.BANKSOPT} SET
			value=(${constant.tables.BANKSOPT}.value::float-OLD.value::float+NEW.value::float)
			WHERE bank_id=bankId AND key='${constant.banks.BALANCE}';

		-- Increase/Decrease Balance on user
		UPDATE ${constant.tables.BANKSUSERSOPT} SET
			value=(${constant.tables.BANKSUSERSOPT}.value::float-OLD.value::float+NEW.value::float)
			WHERE bank_user_id=NEW.bank_user_id AND key='${constant.users.BALANCE}';

		-- Increase/Decrease Balance for Loan on bank
		UPDATE ${constant.tables.TRANSACTIONSOPT} SET
			value=(${constant.tables.TRANSACTIONSOPT}.value::float-OLD.value::float+NEW.value::float)
			WHERE transaction_id=NEW.parent_id AND key='${constant.banks.LOAN_BALANCE}';

		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION delete_transaction_value()
	RETURNS TRIGGER AS $$
	DECLARE
		bankId INTEGER;
		userId INTEGER;
		type_name TEXT;
		instalment FLOAT;
		instalmentPaid FLOAT;
	BEGIN
		SELECT ty.label INTO type_name FROM ${constant.tables.TYPES} ty WHERE ty.id=OLD.type LIMIT 1;
		SELECT bu.bank_id, bu.user_id INTO bankId, userId FROM ${constant.tables.BANKSUSERS} bu WHERE bu.id=OLD.bank_user_id LIMIT 1;

		-- Decrease Balance on bank
		UPDATE ${constant.tables.BANKSOPT} SET value=(ROUND(CAST(${constant.tables.BANKSOPT}.value::float-OLD.value::float AS numeric), 1))
			WHERE bank_id=bankId AND key='${constant.banks.BALANCE}';

		-- Decrease Balance on user
		UPDATE ${constant.tables.BANKSUSERSOPT} SET value=(ROUND(CAST(${constant.tables.BANKSUSERSOPT}.value::float-OLD.value AS numeric), 1))
			WHERE bank_user_id=OLD.bank_user_id AND key='${constant.users.BALANCE}';

		-- Decrease Type count on bank
		UPDATE ${constant.tables.BANKSOPT} SET value=(${constant.tables.BANKSOPT}.value::integer-1)
			WHERE bank_id=bankId AND key='${constant.banks.TRANSACTION_COUNT}';

		-- Decrease Type count on user
		--UPDATE ${constant.tables.BANKSUSERSOPT} SET value=(${constant.tables.BANKSUSERSOPT}.value::integer-1)
			--WHERE bank_user_id=OLD.bank_user_id AND key='${constant.banks.TRANSACTION_COUNT}';

		IF(type_name = '${constant.transactions.LOAN}') THEN
			-- Decrease Loan count on BANK
			UPDATE ${constant.tables.BANKSOPT} SET value=(${constant.tables.BANKSOPT}.value::integer-1)
				WHERE bank_id=bankId AND key='${constant.banks.LOAN_COUNT}';

			-- Decrease Loan count on USER
			UPDATE ${constant.tables.BANKSUSERSOPT} SET value=(${constant.tables.BANKSUSERSOPT}.value::integer-1)
				WHERE bank_user_id=OLD.bank_user_id AND key='${constant.banks.LOAN_COUNT}';

		ELSEIF(OLD.parent_id IS DISTINCT FROM NULL) THEN
			-- Decrease Balance for Loan on bank
			UPDATE ${constant.tables.TRANSACTIONSOPT} SET value=(ROUND(CAST(${constant.tables.TRANSACTIONSOPT}.value::float-OLD.value::float AS numeric), 1))
				WHERE transaction_id=OLD.parent_id AND key='${constant.banks.LOAN_BALANCE}';

			-- Decrease Balance for TYPE on loan
			UPDATE ${constant.tables.TRANSACTIONSOPT} SET value=(ROUND(CAST(${constant.tables.TRANSACTIONSOPT}.value::float-OLD.value::float AS numeric), 2))
				WHERE transaction_id=OLD.parent_id AND key=CONCAT(SUBSTR(type_name, 1, 1), '_ba');

			-- Decrease Balance for TYPE on bank
			UPDATE ${constant.tables.BANKSOPT} SET value=(ROUND(CAST(${constant.tables.BANKSOPT}.value::float-OLD.value::float AS numeric), 1))
				WHERE bank_id=bankId AND key=CONCAT(SUBSTR(type_name, 1, 1), '_ba');

			-- Decrease transaction count on bank
			--UPDATE ${constant.tables.BANKSOPT} SET value=(${constant.tables.BANKSOPT}.value::integer-1)
				--WHERE bank_id=bankId AND key='${constant.banks.TRANSACTION_COUNT}';

			-- Decrease Instalment for Loan on bank
			IF(type_name = 'instalment') THEN
				SELECT value INTO instalment FROM ${constant.tables.TRANSACTIONSOPT}
					WHERE transaction_id=OLD.parent_id AND key='instalment' LIMIT 1;
				SELECT value INTO instalmentPaid FROM ${constant.tables.TRANSACTIONSOPT}
					WHERE transaction_id=OLD.parent_id AND key='${constant.banks.INSTALMENT_BALANCE}' LIMIT 1;
				UPDATE ${constant.tables.TRANSACTIONSOPT} SET value=(SELECT ROUND(instalmentPaid/instalment))
					WHERE transaction_id=OLD.parent_id AND key='${constant.banks.INSTALMENT_COUNT}';
			END IF;
		END IF;

		-- Delete Instalments of Parent
		DELETE FROM ${constant.tables.TRANSACTIONS} WHERE parent_id=OLD.id;

		RETURN OLD;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION delete_transactions_on_delete_bank_user()
	RETURNS TRIGGER AS $$
	BEGIN
		DELETE FROM ${constant.tables.TRANSACTIONS} WHERE bank_user_id=OLD.id;
		RETURN OLD;
	END;
	$$ language 'plpgsql';
`);



query.push(`CREATE OR REPLACE FUNCTION increase_message_badge_count()
	RETURNS TRIGGER AS $$
	BEGIN
		INSERT INTO ${constant.tables.USERSOPT} (user_id, key, value) VALUES (NEW.user_id, '${constant.users.badge.MESSAGES}', 1)
		ON CONFLICT(user_id, key) DO UPDATE SET value=(${constant.tables.USERSOPT}.value::integer+1);
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION decrease_message_badge_count()
	RETURNS TRIGGER AS $$
	BEGIN
		INSERT INTO ${constant.tables.USERSOPT} (user_id, key, value) VALUES (OLD.user_id, '${constant.users.badge.MESSAGES}', 0)
		ON CONFLICT(user_id, key) DO UPDATE SET value=(${constant.tables.USERSOPT}.value::integer-1);
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION modify_delay_loan_badge_count()
	RETURNS TRIGGER AS $$
	DECLARE
		bankUserId BIGINT;
		bankId INT;
		userBadgeId BIGINT;
		userBadgeCount INT;
	BEGIN
		IF((TG_OP='DELETE' AND OLD.value::INT > 0) OR (TG_OP='UPDATE' AND NEW.value::INT <= 0 AND OLD.value::INT > 0)) THEN
			SELECT bank_user_id INTO bankUserId FROM ${constant.tables.TRANSACTIONS} WHERE id=OLD.transaction_id LIMIT 1;
			SELECT bank_id INTO bankId FROM ${constant.tables.BANKSUSERS} WHERE id=bankUserId LIMIT 1;
			SELECT id, value INTO userBadgeId, userBadgeCount FROM ${constant.tables.BANKSUSERSOPT} WHERE
				bank_user_id=bankUserId AND key='${constant.users.badge.DELAYEDLOANS}' LIMIT 1;

			-- For user
			IF(userBadgeCount-1 <= 0) THEN
				DELETE FROM ${constant.tables.BANKSUSERSOPT} WHERE id=userBadgeId;
			ELSE
				UPDATE ${constant.tables.BANKSUSERSOPT} SET value=(${constant.tables.BANKSUSERSOPT}.value::integer-1) WHERE id=userBadgeId;
			END IF;

			-- For bank
			UPDATE ${constant.tables.BANKSOPT} SET value=(${constant.tables.BANKSOPT}.value::integer-1) WHERE
				bank_id=bankId AND key='${constant.banks.badge.DELAYEDLOANS}';

			RETURN OLD;


		ELSEIF((TG_OP='INSERT' AND NEW.value::INT > 0) OR (TG_OP='UPDATE' AND NEW.value::INT > 0 AND OLD.value::INT <= 0)) THEN
			SELECT bank_user_id INTO bankUserId FROM ${constant.tables.TRANSACTIONS} WHERE id=NEW.transaction_id LIMIT 1;
			SELECT bank_id INTO bankId FROM ${constant.tables.BANKSUSERS} WHERE id=bankUserId LIMIT 1;

			-- For user
			INSERT INTO ${constant.tables.BANKSUSERSOPT} (bank_user_id, key, value) VALUES (bankUserId, '${constant.users.badge.DELAYEDLOANS}', 1)
			ON CONFLICT(bank_user_id, key) DO UPDATE SET value=(${constant.tables.BANKSUSERSOPT}.value::integer+1);

			-- For bank
			INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES (bankId, '${constant.banks.badge.DELAYEDLOANS}', 1)
			ON CONFLICT(bank_id, key) DO UPDATE SET value=(${constant.tables.BANKSOPT}.value::integer+1);

			RETURN NEW;
		END IF;

		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
/* query.push(`CREATE OR REPLACE FUNCTION decrease_message_monthly_count()
	RETURNS TRIGGER AS $$
	BEGIN
		INSERT INTO ${constant.tables.BANKSOPT} (bank_id, key, value) VALUES (NEW.bank_id, '${constant.banks.MESSAGE_COUNT}', 1)
		ON CONFLICT(bank_id, key) DO UPDATE SET value=(${constant.tables.BANKSOPT}.value::integer+1);
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`); */

query.push(`CREATE OR REPLACE FUNCTION ticket_update_status()
	RETURNS TRIGGER AS $$
	BEGIN
		UPDATE ${constant.tables.TICKETS} SET status=
		(
			SELECT id FROM ${constant.tables.STATUS} WHERE label=
			(
				CASE
					WHEN (NEW.admin_id IS DISTINCT FROM NULL) THEN '${constant.status.ANSWERED}' -- Admin Replied
					ELSE '${constant.status.UNANSWERED}' -- User replied
				END
			)
			LIMIT 1
		)
		WHERE id=NEW.ticket_id;
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION increase_ticket_badge_count()
	RETURNS TRIGGER AS $$
	BEGIN
		IF
			NEW.status = ( SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.ANSWERED}' LIMIT 1)
		THEN
			INSERT INTO ${constant.tables.USERSOPT} (user_id, key, value) VALUES (NEW.user_id, '${constant.users.badge.TICKETS}', 1)
			ON CONFLICT(user_id, key) DO UPDATE SET value=(${constant.tables.USERSOPT}.value::integer+1);
		END IF;
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION decrease_ticket_badge_count()
	RETURNS TRIGGER AS $$
	BEGIN
		IF
			OLD.status = (SELECT id FROM ${constant.tables.STATUS} WHERE label='${constant.status.ANSWERED}' LIMIT 1)
		THEN
			INSERT INTO ${constant.tables.USERSOPT} (user_id, key, value) VALUES (OLD.user_id, '${constant.users.badge.TICKETS}', 0)
			ON CONFLICT(user_id, key) DO UPDATE SET value=(${constant.tables.USERSOPT}.value::integer-1);
		END IF;
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION increase_post_count()
	RETURNS TRIGGER AS $$
	BEGIN
		INSERT INTO ${constant.tables.OPT} (key, value) VALUES ('${constant.posts.COUNT}', 1)
			ON CONFLICT(key) DO UPDATE SET value=(${constant.tables.OPT}.value::integer+1);

		INSERT INTO ${constant.tables.OPT} (key, value) VALUES (CONCAT(LOWER(SUBSTRING(NEW.category,1,1)), '_co'), 1)
			ON CONFLICT(key) DO UPDATE SET value=(${constant.tables.OPT}.value::integer+1);

		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION decrease_post_count()
	RETURNS TRIGGER AS $$
	BEGIN
		UPDATE ${constant.tables.OPT} SET value=(${constant.tables.OPT}.value::integer-1) WHERE key='${constant.posts.COUNT}';

		UPDATE ${constant.tables.OPT} SET value=(${constant.tables.OPT}.value::integer-1) WHERE key=CONCAT(LOWER(SUBSTRING(OLD.category,1,1)), '_co');

		RETURN OLD;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION increase_comment_count()
	RETURNS TRIGGER AS $$
	BEGIN
		INSERT INTO ${constant.tables.POSTSOPT} (post_id, key, value) VALUES (NEW.post_id, '${constant.posts.COMMENTCOUNT}', 1)
		ON CONFLICT(post_id, key) DO UPDATE SET value=(${constant.tables.POSTSOPT}.value::integer+1);
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION decrease_comment_count()
	RETURNS TRIGGER AS $$
	BEGIN
		UPDATE ${constant.tables.POSTSOPT}
			SET value=(${constant.tables.POSTSOPT}.value::integer-1)
			WHERE
				post_id=OLD.post_id AND
				key='${constant.posts.COMMENTCOUNT}';
		RETURN OLD;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION increase_user_count()
	RETURNS TRIGGER AS $$
	BEGIN
		INSERT INTO ${constant.tables.OPT} (key, value) VALUES ('${constant.users.COUNT}', 1)
		ON CONFLICT(key) DO UPDATE SET value=(${constant.tables.OPT}.value::integer+1);
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION decrease_user_count()
	RETURNS TRIGGER AS $$
	BEGIN
		UPDATE ${constant.tables.OPT} SET value=(${constant.tables.OPT}.value::integer-1) WHERE key='${constant.users.COUNT}';
		RETURN OLD;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION increase_bank_count()
	RETURNS TRIGGER AS $$
	BEGIN
		INSERT INTO ${constant.tables.OPT} (key, value) VALUES ('${constant.banks.COUNT}', 1)
		ON CONFLICT(key) DO UPDATE SET value=(${constant.tables.OPT}.value::integer+1);
		RETURN NEW;
	END;
	$$ language 'plpgsql';
`);
query.push(`CREATE OR REPLACE FUNCTION decrease_bank_count()
	RETURNS TRIGGER AS $$
	BEGIN
		UPDATE ${constant.tables.OPT} SET value=(${constant.tables.OPT}.value::integer-1) WHERE key='${constant.banks.COUNT}';
		RETURN OLD;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION create_transaction_partition_or_insert()
	RETURNS TRIGGER AS $$
	DECLARE
		partition_date TEXT;
		partition TEXT;
	BEGIN
		-- partition_date := to_char(NEW.created_at, 'YYYY_Q'); -- Maybe we want to use custom dates in future, So this doesn't work then
		partition_date := to_char(NOW(), 'YYYY_Q'); -- Each qouarter is separate base on real date, not current_at custom one
		partition := TG_RELNAME || '_' || partition_date;
		IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname=partition) THEN
			RAISE NOTICE 'Creating partition %', partition;
			EXECUTE 'CREATE TABLE ' || partition || '() INHERITS (' || TG_RELNAME || ');';

			EXECUTE 'ALTER TABLE '|| partition ||' ADD PRIMARY KEY(id)';

			EXECUTE 'ALTER TABLE '|| partition ||' ALTER COLUMN bank_user_id SET NOT NULL';
			EXECUTE 'ALTER TABLE '|| partition ||' ALTER COLUMN value SET NOT NULL';
			EXECUTE 'ALTER TABLE '|| partition ||' ALTER COLUMN type SET NOT NULL';
			EXECUTE 'ALTER TABLE '|| partition ||' ALTER COLUMN parent_id SET DEFAULT NULL';

			EXECUTE 'ALTER TABLE '|| partition ||' ADD CONSTRAINT '|| partition ||'_bank_user_fk
				FOREIGN KEY(bank_user_id) REFERENCES ${constant.tables.BANKSUSERS} ON DELETE CASCADE';
			EXECUTE 'ALTER TABLE '|| partition ||' ADD CONSTRAINT '|| partition ||'_type_fk
				FOREIGN KEY(type) REFERENCES ${constant.tables.TYPES} ON DELETE RESTRICT';

			EXECUTE 'CREATE INDEX '|| partition ||'_bank_user_index ON '|| partition ||'(bank_user_id)';
			EXECUTE 'CREATE INDEX '|| partition ||'_parent_index ON '|| partition ||'(parent_id)';
			EXECUTE 'CREATE INDEX '|| partition ||'_type_index ON '|| partition ||'(type)';
			EXECUTE 'CREATE INDEX '|| partition ||'_created_at_index ON '|| partition ||'(created_at)';

			EXECUTE 'CREATE TRIGGER update_'|| partition ||'_value_trigger
				AFTER UPDATE ON '|| partition ||'
				FOR EACH ROW EXECUTE PROCEDURE update_transaction_value();';
			EXECUTE 'CREATE TRIGGER delete_'|| partition ||'_value_trigger
				AFTER DELETE ON '|| partition ||'
				FOR EACH ROW EXECUTE PROCEDURE delete_transaction_value();';
			EXECUTE 'CREATE TRIGGER delete_'|| partition ||'_option_after_deleting_transaction
				AFTER DELETE ON '|| partition ||'
				FOR EACH ROW EXECUTE PROCEDURE delete_transaction_option_after_deleting_transaction();';
		END IF;
		EXECUTE 'INSERT INTO ' || partition || ' SELECT (' || TG_RELNAME || ' ' || quote_literal(NEW) || ').* RETURNING id;';
		RETURN NULL;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION delete_transaction_option_after_deleting_transaction()
	RETURNS TRIGGER AS $$
	BEGIN
		DELETE FROM ${constant.tables.TRANSACTIONSOPT} WHERE transaction_id=OLD.id;
		RETURN OLD;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE OR REPLACE FUNCTION truncate_transaction_option_after_truncate_transactions()
	RETURNS TRIGGER AS $$
	BEGIN
		TRUNCATE TABLE ${constant.tables.TRANSACTIONSOPT};
		--TRUNCATE TABLE ${constant.tables.INSTALMENTS};
		RETURN NULL;
	END;
	$$ language 'plpgsql';
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.STATUS}(
	id SMALLSERIAL PRIMARY KEY NOT NULL,
	label VARCHAR(32) UNIQUE NOT NULL
	);
`);
query.push(`INSERT INTO ${constant.tables.STATUS}
	(label) VALUES
	('${constant.status.PENDING}'), 
	('${constant.status.ACCEPTED}'),
	('${constant.status.DECLINED}'),
	('${constant.status.READED}'),
	('${constant.status.NOTREADED}'),
	('${constant.status.ANSWERED}'),
	('${constant.status.UNANSWERED}'),
	('${constant.status.CLOSED}'),
	('${constant.status.BANNED}'),
	('${constant.status.DELETED}'),
	('${constant.status.PAYED}'),
	('${constant.status.SENTBACK}'),
	('${constant.status.TRANSFERRED}')
;`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.ROLES}(
	id SMALLSERIAL PRIMARY KEY NOT NULL,
	label VARCHAR(32) UNIQUE NOT NULL
	);
`);
query.push(`INSERT INTO ${constant.tables.ROLES}
	(label) VALUES
	('${constant.role.SITEADMIN}'), 
	('${constant.role.MANAGEMENT}'),
	('${constant.role.WRITER}'),
	('${constant.role.CREATOR}'),
	('${constant.role.BANKADMIN}'),
	('${constant.role.USER}');`
);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.DEPARTMENTS}(
	id SMALLSERIAL PRIMARY KEY NOT NULL,
	label VARCHAR(32) UNIQUE NOT NULL
	);
`);
query.push(`INSERT INTO ${constant.tables.DEPARTMENTS}
	(label) VALUES
	('${constant.department.FINANCIAL}'), 
	('${constant.department.TECHNICAL}'),
	('${constant.department.DESIGN}'),
	('${constant.department.SUGGESTIONS}'),
	('${constant.department.MANAGEMENT}');`
);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.TYPES}(
	id SMALLSERIAL PRIMARY KEY NOT NULL,
	label VARCHAR(32) UNIQUE NOT NULL
	);
`);
query.push(`INSERT INTO ${constant.tables.TYPES}
	(label) VALUES
	('${constant.transactions.LOAN}'), 
	('${constant.transactions.PAYMENT}'),
	('${constant.transactions.INITIAL}'),

	('${constant.transactions.INSTALMENT}'),
	('${constant.transactions.COMMISSION}'),
	('${constant.transactions.PENALTY}')
	;`
);


query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.OPT}(
	id SERIAL PRIMARY KEY,
	key VARCHAR(32) UNIQUE NOT NULL,
	value TEXT NOT NULL
	);
`);
query.push(`INSERT INTO ${constant.tables.OPT}
	(key, value) VALUES
	('${constant.visits.TODAY}', 0), 
	('${constant.visits.YESTERDAY}', 0), 
	('${constant.visits.LASTWEEK}', 0), 
	('${constant.visits.TOTAL}', 0), 

	('${constant.visits.ALLBANKS}', 0), 
	('${constant.visits.SEARCHBANKS}', 0), 
	('${constant.visits.BANKSUSERS}', 0), 
	('${constant.visits.BANKSEXPORT}', 0), 
	('${constant.visits.BANKSTRANSACTION}', 0), 
	('${constant.visits.BANKSTRANSACTIONS}', 0), 
	('${constant.visits.BANKSLOANS}', 0), 
	('${constant.visits.BANKSREQUESTS}', 0), 
	('${constant.visits.BANKSINVITATIONS}', 0), 
	('${constant.visits.BANKSMESSAGES}', 0), 
	('${constant.visits.BANKSEDIT}', 0), 
	('${constant.visits.BANKSPLANS}', 0), 
	('${constant.visits.MESSAGES}', 0), 
	('${constant.visits.TICKETS}', 0), 
	('${constant.visits.TUTORIAL}', 0), 
	('${constant.visits.SESSIONS}', 0), 
	('${constant.visits.PROFILE}', 0)
;`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.POSTS}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	title VARCHAR(128) UNIQUE NOT NULL,
	slug VARCHAR(128) UNIQUE NOT NULL,
	content TEXT NOT NULL,
	excert VARCHAR(150) NOT NULL,
	category VARCHAR(32) NOT NULL,
	author_id INTEGER NOT NULL,
	picture_id INTEGER REFERENCES ${constant.tables.FILES}
	);
`);
query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.POSTSOPT}(
	id SERIAL PRIMARY KEY,
	post_id INT REFERENCES ${constant.tables.POSTS} ON DELETE CASCADE,
	key VARCHAR(32) NOT NULL,
	value TEXT NOT NULL,
	UNIQUE(post_id, key)
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.FILES}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	uploader_id INT REFERENCES ${constant.tables.USERS},
	path VARCHAR(256) UNIQUE NOT NULL,
	type VARCHAR(32) NOT NULL,
	alt TEXT,
	title TEXT
	);
`);
query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.DEVICES}(
	created_at DATE DEFAULT CURRENT_DATE,
	os VARCHAR(32) NOT NULL,
	os_ver INT DEFAULT 0,
	browser VARCHAR(32) NOT NULL,
	browser_ver INT DEFAULT 0,
	device VARCHAR(32) DEFAULT 'desktop',
	count INT DEFAULT 1,
	UNIQUE(os, os_ver, browser, browser_ver, device)
	);
`);
query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.COMMENTS}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	content TEXT NOT NULL,
	fullname VARCHAR(32) NOT NULL,
	email VARCHAR(32) NOT NULL,
	parent_id INTEGER DEFAULT 0 REFERENCES ${constant.tables.COMMENTS},
	post_id INTEGER NOT NULL REFERENCES ${constant.tables.POSTS},
	status SMALLINT NOT NULL REFERENCES ${constant.tables.STATUS} ON DELETE RESTRICT
	);
`);
/* query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.POSTSCOMMENTS}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	post_id INTEGER NOT NULL REFERENCES ${constant.tables.POSTS},
	comment_id INTEGER NOT NULL REFERENCES ${constant.tables.COMMENTS},
	UNIQUE(post_id, comment_id));
`); */

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.CONTACTS}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	fullname VARCHAR(32) NOT NULL,
	email VARCHAR(32) NOT NULL,
	phone BIGINT NOT NULL,
	subject VARCHAR(32) NOT NULL,
	content TEXT NOT NULL,
	status SMALLINT NOT NULL REFERENCES ${constant.tables.STATUS} ON DELETE RESTRICT
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.BANKS}(
	created_at DATE DEFAULT CURRENT_DATE,
	updated_at DATE DEFAULT CURRENT_DATE,
	id SERIAL PRIMARY KEY,
	name VARCHAR(60) UNIQUE NOT NULL,
	username VARCHAR(50) UNIQUE NOT NULL,
	avatar TEXT
	);
`);
query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.BANKSOPT}(
	updated_at DATE DEFAULT CURRENT_DATE,
	id SERIAL PRIMARY KEY,
	bank_id INTEGER NOT NULL REFERENCES ${constant.tables.BANKS} ON DELETE CASCADE,
	key VARCHAR(32) NOT NULL,
	value TEXT NOT NULL,
	UNIQUE(bank_id, key));
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.USERS}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	first_name VARCHAR(25) NOT NULL,
	last_name VARCHAR(25) DEFAULT NULL,
	-- username VARCHAR(40) UNIQUE NOT NULL,
	username VARCHAR(40) UNIQUE,
	email VARCHAR(50) DEFAULT NULL,
	email_validate BOOLEAN DEFAULT FALSE,
	password VARCHAR(64) NOT NULL,
	phone BIGINT UNIQUE NOT NULL,
	phone_validate BOOLEAN DEFAULT FALSE,
	avatar TEXT
	);
`);
query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.USERSOPT}(
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES ${constant.tables.USERS} ON DELETE CASCADE,
	key VARCHAR(32) NOT NULL,
	value TEXT NOT NULL,
	UNIQUE(user_id, key)
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.BANKSUSERS}(
	created_at DATE DEFAULT CURRENT_DATE,
	id SERIAL PRIMARY KEY,
	bank_id INTEGER NOT NULL REFERENCES ${constant.tables.BANKS} ON DELETE CASCADE,
	user_id INTEGER NOT NULL REFERENCES ${constant.tables.USERS} ON DELETE CASCADE,
	role SMALLINT DEFAULT NULL REFERENCES ${constant.tables.ROLES} ON DELETE RESTRICT,
	status SMALLINT DEFAULT NULL REFERENCES ${constant.tables.STATUS} ON DELETE RESTRICT,
	parent_id INTEGER DEFAULT NULL REFERENCES ${constant.tables.USERS} ON DELETE CASCADE,
	UNIQUE(bank_id, user_id)
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.BANKSUSERS + '_role_index'}
	ON ${constant.tables.BANKSUSERS}(
		role
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.BANKSUSERSSEARCH}(
	created_at DATE DEFAULT CURRENT_DATE,
	bank_user_id INTEGER PRIMARY KEY REFERENCES ${constant.tables.BANKSUSERS} ON DELETE CASCADE,
	bank_id INTEGER NOT NULL REFERENCES ${constant.tables.BANKS} ON DELETE CASCADE,
	user_id INTEGER NOT NULL REFERENCES ${constant.tables.USERS} ON DELETE CASCADE,
	parent_id INTEGER DEFAULT NULL REFERENCES ${constant.tables.USERS} ON DELETE CASCADE,
	subset_count INTEGER DEFAULT NULL,
	full_name VARCHAR(51) NOT NULL,
	-- username VARCHAR(40) NOT NULL,
	username VARCHAR(40),
	phone BIGINT NOT NULL,
	status VARCHAR(25),
	role VARCHAR(25)
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.BANKSUSERSSEARCH + '_fullname_index'}
	ON ${constant.tables.BANKSUSERSSEARCH}(
		full_name
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.BANKSUSERSSEARCH + '_username_index'}
	ON ${constant.tables.BANKSUSERSSEARCH}(
		username
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.BANKSUSERSSEARCH + '_phone_index'}
	ON ${constant.tables.BANKSUSERSSEARCH}(
		phone
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.BANKSUSERSSEARCH + '_parent_index'}
	ON ${constant.tables.BANKSUSERSSEARCH}(
		parent_id
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.BANKSUSERSOPT}( -- Role, Status, And balance
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY,
	bank_user_id INTEGER NOT NULL REFERENCES ${constant.tables.BANKSUSERS} ON DELETE CASCADE,
	key VARCHAR(32) NOT NULL,
	value TEXT DEFAULT NULL,
	UNIQUE(bank_user_id, key)
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.TRANSACTIONS}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	created_at_bank DATE DEFAULT CURRENT_DATE,
	id BIGSERIAL PRIMARY KEY,
	--bank_user_id INTEGER NOT NULL REFERENCES ${constant.tables.BANKSUSERS} ON DELETE CASCADE,
	bank_user_id INTEGER NOT NULL,
	value NUMERIC(10, 1) NOT NULL CHECK(value >= -999999999 AND value <= 999999999),
	parent_id BIGINT DEFAULT NULL,
	creator_id INT NOT NULL REFERENCES ${constant.tables.USERS},
	type smallint NOT NULL REFERENCES ${constant.tables.TYPES} ON DELETE RESTRICT,
	status smallint NOT NULL REFERENCES ${constant.tables.STATUS} ON DELETE RESTRICT
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.TRANSACTIONSOPT}(
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id BIGSERIAL PRIMARY KEY,
	--transaction_id BIGINT NOT NULL REFERENCES ${constant.tables.TRANSACTIONS} ON DELETE CASCADE,
	transaction_id BIGINT NOT NULL,
	key VARCHAR(32) NOT NULL,
	value TEXT NOT NULL,
	UNIQUE(transaction_id, key));
`);


query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.CAPTCHA}(
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	uuid VARCHAR(36) PRIMARY KEY NOT NULL,
	value NUMERIC(5) NOT NULL,
	ip VARCHAR(15) UNIQUE NOT NULL,
	status SMALLINT DEFAULT 1 REFERENCES ${constant.tables.STATUS} ON DELETE RESTRICT
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.SESSIONS}(
	created_at DATE DEFAULT CURRENT_DATE,
	updated_at DATE DEFAULT CURRENT_DATE,
	id BIGSERIAL PRIMARY KEY NOT NULL,
	session_id VARCHAR(64) NOT NULL,
	user_id INTEGER NOT NULL REFERENCES ${constant.tables.USERS} ON DELETE CASCADE,
	user_agent TEXT NOT NULL,
	ip VARCHAR(15) NOT NULL,
	UNIQUE(session_id)
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.SESSIONS + '_index'}
	ON ${constant.tables.SESSIONS}(
		user_id
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.SESSIONS + '_index_time'}
	ON ${constant.tables.SESSIONS}(
		updated_at
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.MESSAGES}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY NOT NULL,
	bank_id INTEGER DEFAULT NULL,
	sender_id INTEGER NOT NULL REFERENCES ${constant.tables.USERS} ON DELETE CASCADE,
	subject VARCHAR(128) NOT NULL,
	content TEXT NOT NULL
	);
`);
query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.MESSAGESUSERS}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY NOT NULL,
	user_id INTEGER NOT NULL REFERENCES ${constant.tables.USERS} ON DELETE CASCADE,
	message_id INTEGER NOT NULL REFERENCES ${constant.tables.MESSAGES} ON DELETE CASCADE,
	status SMALLINT NOT NULL REFERENCES ${constant.tables.STATUS} ON DELETE RESTRICT
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.MESSAGESUSERS + '_index'}
	ON ${constant.tables.MESSAGESUSERS}(
		user_id
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.MESSAGESUSERS + '_index_time'}
	ON ${constant.tables.MESSAGESUSERS}(
		created_at
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.TICKETS}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY NOT NULL,
	user_id INTEGER NOT NULL REFERENCES ${constant.tables.USERS} ON DELETE CASCADE,
	subject TEXT NOT NULL,
	department_id INTEGER NOT NULL REFERENCES ${constant.tables.DEPARTMENTS},
	status SMALLINT DEFAULT 1 REFERENCES ${constant.tables.STATUS} ON DELETE RESTRICT
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.TICKETS + '_index'}
	ON ${constant.tables.TICKETS}(
		user_id
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.TICKETS + '_index_time'}
	ON ${constant.tables.TICKETS}(
		updated_at
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.TICKETSMESSAGES}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id SERIAL PRIMARY KEY NOT NULL,
	ticket_id INTEGER NOT NULL REFERENCES ${constant.tables.TICKETS} ON DELETE CASCADE,
	admin_id INTEGER REFERENCES ${constant.tables.USERS} ON DELETE RESTRICT,
	content TEXT NOT NULL
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.TICKETSMESSAGES + '_index'}
	ON ${constant.tables.TICKETSMESSAGES}(
		ticket_id
	);
`);
query.push(`CREATE INDEX IF NOT EXISTS ${constant.tables.TICKETSMESSAGES + '_index_time'}
	ON ${constant.tables.TICKETSMESSAGES}(
		created_at
	);
`);

query.push(`CREATE TABLE IF NOT EXISTS ${constant.tables.LOGS}(
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	id BIGSERIAL PRIMARY KEY NOT NULL,
	name VARCHAR(128) NOT NULL,
	total INT DEFAULT 0,
	status VARCHAR(32) NOT NULL
	);
`);



query.push(`-- Updated_at posts
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_posts_updateat')
		THEN
			CREATE TRIGGER update_posts_updateat
			BEFORE UPDATE ON ${constant.tables.POSTS}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`);
query.push(`-- Updated_at banks
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_banks_updateat')
		THEN
			CREATE TRIGGER update_banks_updateat
			BEFORE UPDATE ON ${constant.tables.BANKS}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`);
query.push(`-- Updated_at banks_option
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_banks_option_updateat')
		THEN
			CREATE TRIGGER update_banks_option_updateat
			BEFORE UPDATE ON ${constant.tables.BANKSOPT}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`);
query.push(`-- Updated_at banks_users_option
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_banks_users_option_updateat')
		THEN
			CREATE TRIGGER update_banks_users_option_updateat
			BEFORE UPDATE ON ${constant.tables.BANKSUSERSOPT}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`);
query.push(`-- Updated_at users
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_users_updateat')
		THEN
			CREATE TRIGGER update_users_updateat
			BEFORE UPDATE ON ${constant.tables.USERS}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`);
query.push(`-- Updated_at users_option
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_users_option_updateat')
		THEN
			CREATE TRIGGER update_users_option_updateat
			BEFORE UPDATE ON ${constant.tables.USERSOPT}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`);
/* query.push(`-- Updated_at transactions
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_transactions_updateat')
		THEN
			CREATE TRIGGER update_transactions_updateat
			BEFORE UPDATE ON ${constant.tables.TRANSACTIONS}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`); */
query.push(`-- Updated_at transactions_option
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_transactions_option_updateat')
		THEN
			CREATE TRIGGER update_transactions_option_updateat
			BEFORE UPDATE ON ${constant.tables.TRANSACTIONSOPT}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`);
query.push(`-- Updated_at captcha
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_captcha_updateat')
		THEN
			CREATE TRIGGER update_captcha_updateat
			BEFORE UPDATE ON ${constant.tables.CAPTCHA}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`);
query.push(`-- Updated_at session
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_session_updateat')
		THEN
			CREATE TRIGGER update_session_updateat
			BEFORE UPDATE ON ${constant.tables.SESSIONS}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`);
query.push(`-- Updated_at tickets
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_ticket_updateat')
		THEN
			CREATE TRIGGER update_ticket_updateat
			BEFORE UPDATE ON ${constant.tables.TICKETS}
			FOR EACH ROW EXECUTE PROCEDURE update_updateat_column();
		END IF;
	END$$;
`);

query.push(`-- Increase Posts
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_post_count_trigger')
		THEN
			CREATE TRIGGER increase_post_count_trigger
			AFTER INSERT ON ${constant.tables.POSTS}
			FOR EACH ROW
			EXECUTE PROCEDURE increase_post_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease Posts
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_post_count_trigger')
		THEN
			CREATE TRIGGER decrease_post_count_trigger
			AFTER DELETE ON ${constant.tables.POSTS}
			FOR EACH ROW
			EXECUTE PROCEDURE decrease_post_count();
		END IF;
	END $$;
`);

query.push(`-- Increase Comment Count
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_comment_count_trigger')
		THEN
			CREATE TRIGGER increase_comment_count_trigger
			AFTER INSERT ON ${constant.tables.COMMENTS}
			FOR EACH ROW
			EXECUTE PROCEDURE increase_comment_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease Comment Count
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_comment_count_trigger')
		THEN
			CREATE TRIGGER decrease_comment_count_trigger
			AFTER DELETE ON ${constant.tables.COMMENTS}
			FOR EACH ROW
			EXECUTE PROCEDURE decrease_comment_count();
		END IF;
	END $$;
`);

query.push(`-- Increase Users
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_user_count_trigger')
		THEN
			CREATE TRIGGER increase_user_count_trigger
			AFTER INSERT ON ${constant.tables.USERS}
			FOR EACH ROW
			EXECUTE PROCEDURE increase_user_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease Users
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_user_count_trigger')
		THEN
			CREATE TRIGGER decrease_user_count_trigger
			AFTER DELETE ON ${constant.tables.USERS}
			FOR EACH ROW
			EXECUTE PROCEDURE decrease_user_count();
		END IF;
	END $$;
`);

query.push(`-- Increase Banks
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_bank_count_trigger')
		THEN
			CREATE TRIGGER increase_bank_count_trigger
			AFTER INSERT ON ${constant.tables.BANKS}
			FOR EACH ROW
			EXECUTE PROCEDURE increase_bank_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease Banks
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_bank_count_trigger')
		THEN
			CREATE TRIGGER decrease_bank_count_trigger
			AFTER DELETE ON ${constant.tables.BANKS}
			FOR EACH ROW
			EXECUTE PROCEDURE decrease_bank_count();
		END IF;
	END $$;
`);

query.push(`-- Increase user count bank on add bankUser
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_bank_user_count_trigger')
		THEN
			CREATE TRIGGER increase_bank_user_count_trigger
			AFTER INSERT ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW EXECUTE PROCEDURE increase_bank_user_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease user count bank on delete bankUser
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_bank_user_count_trigger')
		THEN
			CREATE TRIGGER decrease_bank_user_count_trigger
			BEFORE DELETE ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			-- WHEN (OLD.id IS DISTINCT FROM NULL)
			EXECUTE PROCEDURE decrease_bank_user_count();
		END IF;
	END $$;
`);
query.push(`-- Delete transactions on delete bankUser
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='delete_transactions_on_delete_bank_user_trigger')
		THEN
			CREATE TRIGGER delete_transactions_on_delete_bank_user_trigger
			BEFORE DELETE ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			EXECUTE PROCEDURE delete_transactions_on_delete_bank_user();
		END IF;
	END $$;
`);

query.push(`-- Add BankUser to SEARCH
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='add_user_to_search_trigger')
		THEN
			CREATE TRIGGER add_user_to_search_trigger
			AFTER INSERT ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			EXECUTE PROCEDURE add_user_to_search();
		END IF;
	END $$;
`);
query.push(`-- Update BankUser status in SEARCH
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_user_in_search_trigger')
		THEN
			CREATE TRIGGER update_user_in_search_trigger
			AFTER UPDATE ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			WHEN (
				(
					(OLD.status IS DISTINCT FROM NULL AND NEW.status IS DISTINCT FROM NULL AND OLD.status <> NEW.status) OR
					OLD.status IS NOT DISTINCT FROM NULL OR
					NEW.status IS NOT DISTINCT FROM NULL
				) OR (
					(OLD.role IS DISTINCT FROM NULL AND NEW.role IS DISTINCT FROM NULL AND OLD.role <> NEW.role) OR
					OLD.role IS NOT DISTINCT FROM NULL OR
					NEW.role IS NOT DISTINCT FROM NULL
				) OR (
					(OLD.parent_id IS DISTINCT FROM NULL AND NEW.parent_id IS DISTINCT FROM NULL AND OLD.parent_id <> NEW.parent_id) OR
					OLD.parent_id IS NOT DISTINCT FROM NULL OR
					NEW.parent_id IS NOT DISTINCT FROM NULL
				)
			)
			EXECUTE PROCEDURE add_user_to_search();
		END IF;
	END $$;
`);

query.push(`-- Update Users should update SEARCH
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='update_user_update_search_trigger')
		THEN
			CREATE TRIGGER update_user_update_search_trigger
			AFTER UPDATE ON ${constant.tables.USERS}
			FOR EACH ROW
			EXECUTE PROCEDURE update_user_update_search();
		END IF;
	END $$;
`);

query.push(`-- Increase admin count bank on add admin
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_bank_admin_count_trigger')
		THEN
			CREATE TRIGGER increase_bank_admin_count_trigger
			AFTER INSERT ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			WHEN (NEW.role > 0)
			EXECUTE PROCEDURE increase_bank_admin_count();
		END IF;
	END $$;
`);
query.push(`-- Increase admin count bank on update admin
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_bank_admin_count_on_update_trigger')
		THEN
			CREATE TRIGGER increase_bank_admin_count_on_update_trigger
			AFTER UPDATE ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			WHEN (NEW.role > 0 AND (OLD.role IS NOT DISTINCT FROM NULL OR OLD.role = 0))
			EXECUTE PROCEDURE increase_bank_admin_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease admin count bank on update admin
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_bank_admin_count_on_update_trigger')
		THEN
			CREATE TRIGGER decrease_bank_admin_count_on_update_trigger
			AFTER UPDATE ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			WHEN ((NEW.role IS NOT DISTINCT FROM NULL OR NEW.role = 0) AND OLD.role > 0)
			EXECUTE PROCEDURE decrease_bank_admin_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease admin count bank on delete admin
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_bank_admin_count_trigger')
		THEN
			CREATE TRIGGER decrease_bank_admin_count_trigger
			AFTER DELETE ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			WHEN (OLD.role > 0)
			EXECUTE PROCEDURE decrease_bank_admin_count();
		END IF;
	END $$;
`);

query.push(`-- Increase user count bank on adding status (banned, pending, declined,...)
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_bank_user_count_on_status_trigger')
		THEN
			CREATE TRIGGER increase_bank_user_count_on_status_trigger
			AFTER INSERT ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			WHEN (NEW.status > 0)
			EXECUTE PROCEDURE decrease_bank_user_count_on_status();
		END IF;
	END $$;
`);
query.push(`-- Increase user count bank on updating status (banned, pending, declined,...)
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_bank_user_count_on_status_update_trigger')
		THEN
			CREATE TRIGGER increase_bank_user_count_on_status_update_trigger
			AFTER UPDATE ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			WHEN (OLD.status > 0 AND (NEW.status <= 0 OR NEW.status IS NOT DISTINCT FROM NULL))
			EXECUTE PROCEDURE increase_bank_user_count_on_status();
		END IF;
	END $$;
`);
query.push(`-- Decrease user count bank on updating status (banned, pending, declined,...)
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_bank_user_count_on_status_on_update_trigger')
		THEN
			CREATE TRIGGER decrease_bank_user_count_on_status_on_update_trigger
			AFTER UPDATE ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			WHEN ((OLD.status <= 0 OR OLD.status IS NOT DISTINCT FROM NULL) AND NEW.status > 0)
			EXECUTE PROCEDURE decrease_bank_user_count_on_status();
		END IF;
	END $$;
`);
query.push(`-- Decrease user count bank on removing status (banned, pending, declined,...)
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_bank_user_count_on_status_trigger')
		THEN
			CREATE TRIGGER decrease_bank_user_count_on_status_trigger
			BEFORE DELETE ON ${constant.tables.BANKSUSERS}
			FOR EACH ROW
			WHEN (OLD.status > 0)
			EXECUTE PROCEDURE increase_bank_user_count_on_status();
		END IF;
	END $$;
`);

query.push(`-- Increase Message Badge
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_message_badge_count_trigger')
		THEN
			CREATE TRIGGER increase_message_badge_count_trigger
			AFTER INSERT ON ${constant.tables.MESSAGESUSERS}
			FOR EACH ROW
			WHEN(NEW.status <> '4') -- Readed
			EXECUTE PROCEDURE increase_message_badge_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease Message Badge on read
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_message_badge_count_trigger')
		THEN
			CREATE TRIGGER decrease_message_badge_count_trigger
			AFTER UPDATE OF status ON ${constant.tables.MESSAGESUSERS}
			FOR EACH ROW
			WHEN (NEW.status='4' AND OLD.status <> NEW.status)
			EXECUTE PROCEDURE decrease_message_badge_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease Message Badge on delete
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_delete_message_badge_count_trigger')
		THEN
			CREATE TRIGGER decrease_delete_message_badge_count_trigger
			AFTER DELETE ON ${constant.tables.MESSAGESUSERS}
			FOR EACH ROW
			WHEN (OLD.status <> '4' AND pg_trigger_depth() = 0)
			EXECUTE PROCEDURE decrease_message_badge_count();
		END IF;
	END $$;
`);
/* query.push(`-- Decrease Message Monthly Count for bank on Insert
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_message_monthly_count_trigger')
		THEN
			CREATE TRIGGER decrease_message_monthly_count_trigger
			AFTER INSERT ON ${constant.tables.MESSAGESUSERS}
			FOR EACH ROW
			WHEN (NEW.bank_id IS DISTINCT FROM NULL)
			EXECUTE PROCEDURE decrease_message_monthly_count();
		END IF;
	END $$;
`); */


query.push(`-- Increase FullyPaid Loan
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_fully_paid_loan_trigger')
		THEN
			CREATE TRIGGER increase_fully_paid_loan_trigger
			AFTER INSERT ON ${constant.tables.TRANSACTIONSOPT}
			FOR EACH ROW
			WHEN (NEW.key='${constant.transactions.FULLYPAID}')
			EXECUTE PROCEDURE increase_fully_paid_loan();
		END IF;
	END $$;
`);

query.push(`-- Decrease FullyPaid Loan
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_fully_paid_loan_trigger')
		THEN
			CREATE TRIGGER decrease_fully_paid_loan_trigger
			AFTER DELETE ON ${constant.tables.TRANSACTIONSOPT}
			FOR EACH ROW
			WHEN (OLD.key='${constant.transactions.FULLYPAID}')
			EXECUTE PROCEDURE decrease_fully_paid_loan();
		END IF;
	END $$;
`);


query.push(`-- Increase Delayed Loan
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_delayed_loan_badge_count_trigger')
		THEN
			CREATE TRIGGER increase_delayed_loan_badge_count_trigger
			AFTER INSERT OR UPDATE
			ON ${constant.tables.TRANSACTIONSOPT}
			FOR EACH ROW
			WHEN (NEW.key='delayed')
			EXECUTE PROCEDURE modify_delay_loan_badge_count();
		END IF;
	END $$;
`);

query.push(`-- Decrease Delayed Loan
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_delayed_loan_badge_count_trigger')
		THEN
			CREATE TRIGGER decrease_delayed_loan_badge_count_trigger
			AFTER DELETE ON ${constant.tables.TRANSACTIONSOPT}
			FOR EACH ROW
			WHEN (OLD.key='delayed')
			EXECUTE PROCEDURE modify_delay_loan_badge_count();
		END IF;
	END $$;
`);


query.push(`-- Ticket Status update
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='ticket_update_status_trigger')
		THEN
			CREATE TRIGGER ticket_update_status_trigger
			AFTER INSERT ON ${constant.tables.TICKETSMESSAGES}
			FOR EACH ROW
			-- WHEN (NEW.status='4' AND OLD.status <> NEW.status)
			EXECUTE PROCEDURE ticket_update_status();
		END IF;
	END $$;
`);
query.push(`-- Increase Ticket Badge
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='increase_ticket_badge_count_trigger')
		THEN
			CREATE TRIGGER increase_ticket_badge_count_trigger
			AFTER UPDATE OF status ON ${constant.tables.TICKETS}
			FOR EACH ROW
			WHEN(NEW.status <> OLD.status)
			EXECUTE PROCEDURE increase_ticket_badge_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease Ticket Badge on read
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_ticket_badge_count_trigger')
		THEN
			CREATE TRIGGER decrease_ticket_badge_count_trigger
			AFTER UPDATE OF status ON ${constant.tables.TICKETS}
			FOR EACH ROW
			WHEN (OLD.status <> NEW.status)
			EXECUTE PROCEDURE decrease_ticket_badge_count();
		END IF;
	END $$;
`);
query.push(`-- Decrease Ticket Badge on delete
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='decrease_delete_ticket_badge_count_trigger')
		THEN
			CREATE TRIGGER decrease_delete_ticket_badge_count_trigger
			AFTER DELETE ON ${constant.tables.TICKETS}
			FOR EACH ROW
			EXECUTE PROCEDURE decrease_ticket_badge_count();
		END IF;
	END $$;
`);

query.push(`-- Check for admin privileges before posting ticket answer
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='check_admin_privileges_trigger')
		THEN
			CREATE TRIGGER check_admin_privileges_trigger
			BEFORE INSERT ON ${constant.tables.TICKETSMESSAGES}
			FOR EACH ROW
			WHEN (NEW.admin_id > 0)
			EXECUTE PROCEDURE check_admin_privileges();
		END IF;
	END $$;
`);

query.push(`-- Delete admin privileges, Has to remove everything he did
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='delete_admin_privileges_trigger')
		THEN
			CREATE TRIGGER delete_admin_privileges_trigger
			AFTER DELETE ON ${constant.tables.USERSOPT}
			FOR EACH ROW
			WHEN (OLD.key='${constant.ROLE}')
			EXECUTE PROCEDURE delete_admin_privileges();
		END IF;
	END $$;
`);

query.push(`-- Partitioning Transaction
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='partition_transaction_trigger')
		THEN
			CREATE TRIGGER partition_transaction_trigger
			BEFORE INSERT ON ${constant.tables.TRANSACTIONS}
			FOR EACH ROW EXECUTE PROCEDURE create_transaction_partition_or_insert();
		END IF;
	END $$;
`);

query.push(`-- Partitioning Transaction - delete from Transaction_Option after DELETE Transaction
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='delete_from_transaction_option_trigger')
		THEN
			CREATE TRIGGER delete_from_transaction_option_trigger
			AFTER DELETE ON ${constant.tables.TRANSACTIONS}
			FOR EACH ROW EXECUTE PROCEDURE delete_transaction_option_after_deleting_transaction();
		END IF;
	END $$;
`);
query.push(`-- Partitioning Transaction - delete from Transaction_Option after TRUNCATE Transaction
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='truncate_from_transaction_option_trigger')
		THEN
			CREATE TRIGGER truncate_from_transaction_option_trigger
			AFTER TRUNCATE ON ${constant.tables.TRANSACTIONS}
			FOR EACH STATEMENT EXECUTE PROCEDURE truncate_transaction_option_after_truncate_transactions();
		END IF;
	END $$;
`);

query.push(`-- Bank balance by transaction
DO $$
	BEGIN
		IF NOT EXISTS
			(SELECT 1 FROM pg_trigger WHERE tgname='add_transaction_value_trigger')
		THEN
			CREATE TRIGGER add_transaction_value_trigger
			-- It has to be BEFORE, to work with Partition
			BEFORE INSERT ON ${constant.tables.TRANSACTIONS}
			FOR EACH ROW EXECUTE PROCEDURE add_transaction_value();
		END IF;
	END $$;
`);

// Default Bank and User
if(process.argv.length > 2 && process.argv[2] === 'add'){
	query.push(`INSERT INTO ${constant.tables.USERS}
		(id, first_name, username, email, email_validate, password, phone, phone_validate) VALUES
		(
			1,
			'بانکمون',
			'bankemoon',
			'info@bankemoon.com',
			true,
			'qwerasdzxc123',
			'9121231234',
			true
		)
	;`);
	query.push(`INSERT INTO ${constant.tables.USERSOPT}
		(user_id, key, value) VALUES
		(1, '${constant.ROLE}', (SELECT id FROM ${constant.tables.ROLES} WHERE label='${constant.role.SITEADMIN}' LIMIT 1))
		-- (1, 'banks', '{1}')
	;`);
	query.push(`INSERT INTO ${constant.tables.BANKS}
		(id, name, username) VALUES
		(1, 'بانکمون', 'bankemoon')
	;`);
	query.push(`INSERT INTO ${constant.tables.BANKSUSERS}
		(bank_id, user_id, role) VALUES
		(1, 1, (SELECT id FROM ${constant.tables.ROLES} WHERE label='${constant.role.CREATOR}' LIMIT 1))
	;`);
	query.push(`SELECT nextval('${constant.tables.BANKS}_id_seq');`);
	query.push(`SELECT nextval('${constant.tables.USERS}_id_seq');`);
	query.push(`SELECT nextval('${constant.tables.BANKSUSERS}_id_seq');`);
	/* query.push(`INSERT INTO ${constant.tables.OPT}
		(key, value) VALUES
		('${constant.banks.COUNT}', 1),
		('${constant.users.COUNT}', 1)
	;`); */
}
else{
	log.info("[!] Now use add argument");
}

log.info("[!] Initialize database...");
for(let i in query){
	db.query(query[i])
		.then(() => log.info(i))
		.catch(err => {
			if(err.message.indexOf('duplicate key') < 0){
				log.error(err.stack);
				log.error(query[i]);
			}
			// process.exit();
		});
}
