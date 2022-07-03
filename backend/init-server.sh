#! /usr/bin/bash
echo "Installing Postgresql 10..."
yum install https://download.postgresql.org/pub/repos/yum/10/redhat/rhel-7-x86_64/pgdg-centos10-10-2.noarch.rpm -y
yum install postgresql10 postgresql10-server -y

echo "Configure Postgresql..."
/usr/pgsql-10/bin/postgresql-10-setup initdb
systemctl enable postgresql-10
systemctl start postgresql-10
echo "Postgresql Completed!"

echo "Installing Nginx Repository..."
yum install epel-release -y

echo "Installing Nginx..."
yum install nginx openssl openssl-devel libxslt-devel gd gd-devel geoip-devel perl-ExtUtils-Embed gperftools-devel -y
echo "Compile Nginx with nginx-http-rdns Module"
echo "Download Nginx source from:"
nginx -v
echo "http://nginx.org/download/nginx-1.12.2.tar.gz"
echo "Clone Module from:"
echo "https://github.com/flant/nginx-http-rdns"
echo "Use these parameters for ./configure:"
echo "./configure -add-dynamic-module=../nginx-http-rdns "
nginx -V
echo "Then 'make modules'"
echo "And copy module to Nginx modules:"
echo "sudo cp objs/ngx_http_rdns_module.so /usr/share/nginx/modules/"

echo "Auto-Start Nginx..."
systemctl start nginx
systemctl enable nginx

echo "Configure Firewall..."
firewall-cmd --permanent --zone=public --add-service=http
firewall-cmd --permanent --zone=public --add-service=https
firewall-cmd --reload
echo "Nginx Completed!"

echo "Installing NodeJS..."
# curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -
curl --silent --location https://rpm.nodesource.com/setup_10.x | sudo bash -
yum install nodejs cairo-devel libjpeg-devel giflib-devel cpp -y
echo "Update NodeJS:"
echo "* curl https://www.npmjs.com/install.sh | sh"
echo "NodeJS Completed!"

echo "Installing Development Tools..."
yum groupinstall "Development Tools" -y
echo "Development Tools Completed!"

echo "Installing Git..."
yum install git -y
echo "Git Completed!"

echo "Installing Redis..."
yum install redis -y
yum service start redis
yum service enable redis
echo "Change these lines in /etc/redis.conf"
cat cache/redis.conf
echo "Redis Completed!"

echo "AutoUpdate security patches..."
yum install yum-cron -y
echo "Changes:\n
	update_cmd = security\n
	apply_updates = yes"

echo "Creating users..."
useradd -mp backend backend
echo "Users completed!"

vim /etc/yum/yum-cron.conf
systemctl enable yum-cron
systemctl restart yum-cron
echo "AutoUpdate Completed!"

echo "Installing Fail2Ban..."
yum install fail2ban -y
systemctl enable fail2ban
echo
"[DEFAULT]
bantime = 600
banaction = iptables-multiport
[sshd]
enabled = true" > /etc/fail2ban/jail.local
systemctl restart fail2ban
echo "Fail2Ban Completed!"

echo "Disable Root SSH..."
echo "PermitRootLogin no" >> /etc/ssh/sshd_config

echo "Open Port 80..."
firewall-cmd --zone=public  --permanent --add-service=http
echo "Open Port 443..."
firewall-cmd --zone=public  --permanent --add-service=https

# echo "Set domain..."
# echo "bankemoon" > /etc/sysconfig/network
# echo "95.216.55.129 bankemoon.com bankemoon" >> /etc/hosts

echo "Install NPM Packages..."
npm install pm2 -g
npm install bunyan -g

echo "Install ZLib 1.2.11..."
wget http://www.zlib.net/zlib-1.2.11.tar.gz
tar -xzvf zlib-1.2.11.tar.gz
zlib-1.2.11/./configure
make zlib-1.2.11
make install zlib-1.2.11

echo "Installing Let's Encrypt..."
yum install certbot-nginx
certbot --nginx \
	-d bankemoon.com \
	-d www.bankemoon.com \
	-d mail.bankemoon.com \
	-d cdn.bankemoon.com \
	-d api.bankemoon.com \
	-d cpanel.bankemoon.com
echo "Add to cronjob"
(crontab -l; echo "15 3 * * * /usr/bin/certbot renew --quiet") | crontab
echo "Add Backups to cronjob"
(crontab -l; echo "45 2 * * * . ~/.bashrc; /bankemoon/db/./backup.sh") | crontab
(crontab -l; echo "25 3 * * * . ~/.bashrc; node /bankemoon/cron/daily.js") | crontab

echo "Show a list of opened port with SELinux:"
semanage port -l | grep http_port_t
echo "Open port 5000 with SELinux..."
echo "semanage port -(a/m) -t http_port_t -p tcp 5000"
# echo "Open port 2082 with Firewall..."
# echo "firewall-cmd --permanent --zone=public --add-port=2082/tcp"
# echo "firewall-cmd --reload"

echo "Give access to CDN files"
echo "chcon -Rt httpd_sys_content_t /bankemoon/cdn"

echo "Create alias for showing api_log"
echo 'alias api_log="tail -f /home/backend/.pm2/logs/api-out.log | bunyan"' >> /root/.bashrc
echo "Make bashrc:"
echo "export REACT_APP_API='https://api.bankemoon.com'
export REACT_APP_CDN='https://cdn.bankemoon.com'
export PGDATA='/usr/local/pgsql/data/'
export PGNAME='bankemoon'
export PGHOST='localhost'
export PGUSER='postgres'
export PGPASSWORD=''
export DB_BACKUP_PASS=''" >> /root/.bashrc
echo "export BANKS_SECRET='(*SC&y*YHc78TSC^%TS6crf6STGC&sc^'
export REACT_APP_API='https://api.bankemoon.com'
export REACT_APP_CDN='https://cdn.bankemoon.com'
export NODE_PRODUCTION='production';
export NODE_ENV=$NODE_PRODUCTION;
export REDIS='305e8b9ea5fed868bec7a3313d37c7a872808d91ca4b7e68e0a8039936b52334'
export PGDATA='/usr/local/pgsql/data/'
export PGNAME='bankemoon'
export PGHOST='localhost'
export PGUSER='postgres'
export PGPASSWORD='LOKJSKC(*U&*Cs6TCTg6RSC%#$Ce5FCYhoiSCIS()CujgytUCR%6'
export EMAIL_USER='no-reply@bankemoon.com'
export EMAIL_PASSWD='~]nxT?y[%9_yx+nZlK'
export SMS_USERNAME=''
export SMS_PASSWORD=''" >> /home/backend/.bashrc

