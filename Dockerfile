FROM node:20 as base

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . .


# FROM base as production

# ENV NODE_PATH=./build

RUN npm run build

# CMD node dist/cjs/index.js
# CMD node up.js