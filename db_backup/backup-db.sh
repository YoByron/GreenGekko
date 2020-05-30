#!/bin/bash

MYDB=$1
pg_dump -C $MYDB -U gekkodbuser | gzip -c | cat > $MYDB.sql.gz
