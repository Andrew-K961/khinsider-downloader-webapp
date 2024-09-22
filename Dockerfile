FROM node:18.16-bookworm-slim
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
RUN apt-get update -y
RUN apt-get install -y python3
RUN apt install -y python3-bs4
COPY . .
EXPOSE 3000
RUN chown -R node /usr/src/app
RUN npm prune --production
USER node
CMD ["npm", "start"]
HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1
