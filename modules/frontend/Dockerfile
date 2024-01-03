FROM node:16.0.0 as build-stage
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY ./ .
RUN yarn run build

FROM nginx as production-stage
RUN mkdir /app
RUN mkdir /etc/nginx/templates
COPY --from=build-stage /app/dist /app
COPY server.conf.template /etc/nginx/templates/server.conf.template
COPY nginx.conf /etc/nginx/nginx.conf
