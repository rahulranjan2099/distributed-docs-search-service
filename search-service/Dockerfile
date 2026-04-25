FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "npx wait-on http://elasticsearch:9200 tcp:kafka:29092 && sleep 15 && npm run create:index && npm run dev"]