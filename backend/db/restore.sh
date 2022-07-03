#! /usr/bin/bash

ENCFILE=$1;
if [ -z "$ENCFILE" ]
then
	echo "-1"
	exit -1
fi

FILENAME="${ENCFILE%.*}"
openssl aes-256-cbc -salt -in $ENCFILE -d -pass env:DB_BACKUP_PASS > $FILENAME
echo "openssl aes-256-cbc -salt -in ${ENCFILE} -d -pass env:DB_BACKUP_PASS > ${FILENAME}"
gzip -d $FILENAME -c | pg_restore -Fc --single-transaction --dbname=$PGNAME
