#!/bin/sh
docker run --publish 80:80 --mount type=bind,src="$(pwd)/web",dst="/usr/local/apache2/htdocs" trove-query-builder
