FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install all dependencies (production)
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
