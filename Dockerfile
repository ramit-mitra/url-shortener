# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:latest

WORKDIR /app

COPY bun.lockb .
COPY package.json .
COPY tsconfig.json .
COPY src src

RUN bun install --production

EXPOSE 3000/tcp

CMD ["bun", "src/index.ts"]