FROM node:20-alpine AS web-build

WORKDIR /app

COPY web/package.json web/package-lock.json* ./web/

WORKDIR /app/web
RUN npm install

COPY web/ /app/web/
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/

WORKDIR /app/server
RUN npm install --production

WORKDIR /app
COPY server/src/ /app/server/src/
COPY web/dist/ /app/web/dist/
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

ENV PORT=3001
ENV CHROMA_URL=http://localhost:8000
ENV SQLITE_PATH=/data/app.db

EXPOSE 3001

CMD ["/app/entrypoint.sh"]

