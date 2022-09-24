FROM node:16-slim

WORKDIR /app
RUN apt-get update && apt-get install -y wget && \
    wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2004-x86_64-100.6.0.deb && \
    apt-get install -y ./mongodb-database-tools-ubuntu2004-x86_64-100.6.0.deb && rm ./mongodb-database-tools-ubuntu2004-x86_64-100.6.0.deb
COPY credentials/${GCS_KEY} ./credentials/${GCS_KEY}
COPY package.json ./
RUN npm i --production

COPY index.js ./
CMD ["node", "./index.js"]