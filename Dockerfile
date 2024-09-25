FROM nikolaik/python-nodejs:python3.8-nodejs18-slim
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
RUN pip install bs4
COPY . .
EXPOSE 3000
RUN chown -R pn /usr/src/app
RUN npm prune --production
USER pn
CMD ["npm", "start"]
HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1
