FROM node:18-alpine

WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
