FROM node:20-alpine
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev || npm install --production
COPY server/src/ ./src/

ENV PORT=3001
ENV SQLITE_PATH=/data/app.db
EXPOSE 3001
CMD ["node", "src/index.js"]
