FROM node:18-alpine AS builder

WORKDIR /workspace

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /workspace

COPY --from=builder /workspace/package.json ./
COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/.next ./.next
COPY --from=builder /workspace/public ./public
COPY --from=builder /workspace/app ./app

ENV PORT 3000
ENV NODE_ENV production

EXPOSE 3000

CMD ["npm", "start"]
