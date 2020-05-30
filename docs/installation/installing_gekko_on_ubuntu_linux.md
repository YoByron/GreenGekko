# Install GreenGekko on Ubuntu Linux

On discord chat (https://discord.gg/26wMygt), where users are helping each other, @marty#4491 contributed this guide on how to install GreenGekko on ubuntu linux (using Google Cloud or Azure services)

## References
GreenGekko on GitHub (https://github.com/mark-sch/GreenGekko)
Install PostgreSQL (https://computingforgeeks.com/install-postgresql-12-on-ubuntu/)

### GreenGekko Installation

1. Create a virtual machine on Google Cloud compute (Ubuntu 19.10) or Azure (18.04 LTS)
2. Enable ssh and connect via putty (or not)
3. Install git if required (sudo apt install git)
4. Install build dependencies (sudo apt-get install build-essential)
5. Install npm if required (sudo apt install npm)
6. curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
7. sudo apt-get install -y nodejs
8. git clone https://github.com/mark-sch/GreenGekko
9. cd gekko
10. Install tulip and talib (npm i talib tulind)
11. npm install
12. cd exchange
13. npm install

### Postgres Install

14. wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
15. echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" |sudo tee  /etc/apt/sources.list.d/pgdg.list
16. sudo apt update
17. sudo apt upgrade
18. sudo apt -y install postgresql-12 postgresql-client-12
19. sudo service postgresql start

### Configure Postgres

20. sudo -u postgres psql
21. psql -c "alter user postgres with password 'StrongAdminP@ssw0rd'"
22. create user gekkodbuser with encrypted password '1234';
23. alter role gekkodbuser createdb;

### Other stuff to mke your life easier

24. Install pm2 (sudo npm install pm2 -g)
25. Create aliases (edit ./bashrc)