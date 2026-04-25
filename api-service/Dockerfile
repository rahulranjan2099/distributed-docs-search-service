FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx wait-on tcp:postgres:5432 && npm run migrate && npm start"]