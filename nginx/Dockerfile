FROM nginx:alpine

# Generate a self-signed certificate valid for 10 years (dev only)
RUN apk add --no-cache openssl \
 && mkdir -p /etc/nginx/certs \
 && openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/nginx/certs/key.pem \
      -out    /etc/nginx/certs/cert.pem \
      -subj   "/CN=localhost"

COPY nginx.conf /etc/nginx/conf.d/default.conf
