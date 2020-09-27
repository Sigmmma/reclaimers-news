FROM alpine:latest

# install dependencies and set up an app directory
RUN apk add --no-cache nodejs npm
RUN mkdir -p /usr/local/app
WORKDIR /usr/local/app

# install dependencies, then remove npm to save space
COPY package.json .
COPY package-lock.json .
RUN npm ci
RUN apk del npm

# copy the app sources over
COPY commands commands
COPY reclaimers.js .

EXPOSE 8080
ENTRYPOINT ["node", "reclaimers.js"]
CMD ["--help"]
