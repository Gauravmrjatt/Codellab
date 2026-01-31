FROM node:20-alpine

# Install docker-cli so this container can spawn sibling containers
RUN apk add --no-cache docker-cli

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
