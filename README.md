## Developing
To build the docker application, naming the image `trove-query-builder`:

```bash
docker build -t trove-query-builder .
```

To launch the `trove-query-builder` container:
```bash
docker run --publish 80:80 trove-query-builder
```

For convenience while developing the application, you can use the `--mount` command to 
mount the `web` folder into the container, so that you can edit the HTML and JS code and have the changes reflected in the running container 
immediately, without having to rebuild the docker image. 
```bash
docker run --publish 80:80 --mount type=bind,src=`pwd`/web,dst=/usr/local/apache2/htdocs trove-query-builder
```

