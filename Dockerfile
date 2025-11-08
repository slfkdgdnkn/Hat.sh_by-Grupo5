# ---- Etapa de construcción (builder) ----
FROM node:18-alpine as builder

WORKDIR /app

# Copiar solo los archivos necesarios para instalar dependencias
COPY Hat-DepSecOps/package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only-production

# Copiar todo el código fuente
COPY Hat-DepSecOps/ ./

# Desactivar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Construir la aplicación (genera salida en /app/dist)
RUN npm run build


# ---- Etapa de producción (nginx completamente reconfigurado y logs a stdout/stderr) ----
# Usamos alpine puro, no la imagen oficial de Nginx
FROM alpine:3.18

# Instalar Nginx y curl (para healthchecks, etc.)
RUN apk update && apk upgrade && apk add --no-cache nginx curl

# Crear usuario/grupo no root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copiar la app construida desde la etapa builder
# Nginx servirá los archivos desde este directorio. Asegúrate de que los permisos sean correctos.
COPY --from=builder /app/dist /usr/share/nginx/html

# --- CONFIGURACIÓN DE NGINX DESDE CERO ---

# Crear los directorios necesarios para Nginx con permisos correctos
RUN mkdir -p /etc/nginx/conf.d \
    /tmp/nginx/client_body_temp \
    /tmp/nginx/proxy_temp \
    /tmp/nginx/fastcgi_temp \
    /tmp/nginx/uwsgi_temp \
    /tmp/nginx/scgi_temp \
    /tmp/nginx/logs && \
    chown -R nextjs:nodejs /tmp/nginx \
    /usr/share/nginx/html \
    /etc/nginx && \
    chmod -R 755 /tmp/nginx \
    /usr/share/nginx/html \
    /etc/nginx

# Creamos nuestro propio nginx.conf desde cero usando un heredoc
# Redirigimos error_log y access_log a /dev/stdout y /dev/stderr
RUN cat <<EOF > /etc/nginx/nginx.conf
# Configuración de Nginx optimizada para usuario no root
# NO usar directiva 'user' cuando ya ejecutamos como usuario no privilegiado
worker_processes auto;
error_log /tmp/nginx/logs/error.log warn;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Definir el formato de log 'main'
    log_format main '\\\$remote_addr - \\\$remote_user [\\\$time_local] "\\\$request" '
                    '\\\$status \\\$body_bytes_sent "\\\$http_referer" '
                    '"\\\$http_user_agent" "\\\$http_x_forwarded_for"';

    # Access log en directorio temporal con permisos
    access_log /tmp/nginx/logs/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Directorios temporales con permisos de escritura para usuario no root
    client_body_temp_path /tmp/nginx/client_body_temp;
    proxy_temp_path /tmp/nginx/proxy_temp;
    fastcgi_temp_path /tmp/nginx/fastcgi_temp;
    uwsgi_temp_path /tmp/nginx/uwsgi_temp;
    scgi_temp_path /tmp/nginx/scgi_temp;

    # Compresión gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss text/javascript;

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Incluir configuraciones adicionales
    include /etc/nginx/conf.d/*.conf;
}
EOF

# Crear el archivo default.conf para el servidor Next.js usando un heredoc
RUN cat <<EOF > /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Asegurar permisos correctos para todos los directorios necesarios
RUN chown -R nextjs:nodejs /etc/nginx /tmp/nginx /usr/share/nginx/html && \
    chmod -R 755 /etc/nginx /tmp/nginx /usr/share/nginx/html

# Cambiar a usuario no privilegiado para máxima seguridad
USER nextjs

# Exponer el puerto 8080 (puerto no privilegiado, no requiere root)
EXPOSE 8080

# Iniciar Nginx en primer plano
ENTRYPOINT ["nginx", "-g", "daemon off;"]