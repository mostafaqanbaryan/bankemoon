#! /usr/bin/bash

NAME="DbBackup"
TABLE="li_logs"
FILENAME=$PGNAME.$(date +%Y-%m-%d).bak
FILENAMEGZ=$FILENAME.gz.enc
LOG_ERROR=/var/log/backup_errors.log

# Backup database
if ! pg_dump -Fc $PGNAME 2> $LOG_ERROR > $FILENAME
then
	# Send Email
	#cat $LOG_ERROR | mailx 'shantia_73@yahoo.com' -s 'Database Backup FAILED'
	RESULT="ERROR_DB"
else
	# Compressed with gzip
	gzip -9f $FILENAME -c | openssl aes-256-cbc -salt -pass env:DB_BACKUP_PASS -e > $FILENAMEGZ
	rm $FILENAME

	# Upload to FTP
	if ! lftp -c "open $FTPSERVER -u $FTPUSER,$FTPPASSWORD; put -O /db/ $FILENAMEGZ"
	then
		RESULT="ERROR_FTP"
	else
		RESULT="INFO"
	fi
fi


# Logger
psql -h $PGHOST -U $PGUSER -d $PGNAME -c "INSERT INTO $TABLE (name, status) VALUES ('$NAME', '$RESULT');"
