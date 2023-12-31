FROM node:20 as base

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . .

RUN npm run build
