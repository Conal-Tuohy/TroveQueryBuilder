# syntax=docker/dockerfile:1
FROM httpd:2.4
# Install the UI
COPY ./web/ /usr/local/apache2/htdocs/
# httpd is listening on port 80
EXPOSE 80/tcp
