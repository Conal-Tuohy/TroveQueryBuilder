#!/bin/sh
docker exec -it $(docker ps | grep trove-query-builder | cut -d ' ' -f 1) bash

