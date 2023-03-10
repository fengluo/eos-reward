FROM node:19-alpine

WORKDIR /app
COPY package*.json /app/
RUN npm install && npm cache clean --force
COPY . /app
CMD [ "npm", "run", "start"]