# Base stage
FROM node:18.12.1-alpine as base
WORKDIR /app
COPY package.json /app/package.json
RUN npm install -g npm@9.2.0
RUN npm install -g @angular/cli@15.0.4
RUN npm install dexie --save
RUN npm install ngx-papaparse --save
COPY . /app

# Development stage
FROM base as dev
CMD ng serve --host 0.0.0.0 --port 80

# Build for Production
FROM base as build
RUN npm run build

# Production stage
FROM nginx:1.23.3 as prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx-custom.conf /etc/nginx/conf.d/default.conf
