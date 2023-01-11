FROM node:slim as build

WORKDIR /tmp/
COPY package*.json ./
RUN npm i --no-optional --production

FROM node:slim

ENV OTLP_GRPC_ENDPOINT host.docker.internal:4137

WORKDIR /usr/src/app

COPY --from=build /tmp/node_modules node_modules
COPY server.js .

CMD node ./server.js
