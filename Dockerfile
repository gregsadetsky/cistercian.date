FROM node:latest
ADD . /code
WORKDIR /code
RUN npm install && npm run build

