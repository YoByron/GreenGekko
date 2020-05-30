#!/bin/bash

MYDB=$1
zcat $MYDB.sql.gz | psql -h localhost -U gekkodbuser -d postgres
