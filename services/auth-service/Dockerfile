#Use secure minimal base image
FROM node:18-alpine

#Set working directory
WORKDIR /usr/src/app

#Install dependencies
COPY package* ./
RUN npm install

#Copy source code
COPY . .

#Expose port
EXPOSE 3000

#Start Service
CMD [ "npm", "run", "dev" ]