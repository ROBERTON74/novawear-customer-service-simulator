FROM node:24-slim

WORKDIR /app

COPY package.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm run install:all

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/data/novawear.sqlite
EXPOSE 4000

CMD ["npm", "start"]
