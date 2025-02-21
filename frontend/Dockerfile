# 1️⃣ Build the frontend using Node.js
FROM node:20 AS builder

# 2️⃣ Set working directory
WORKDIR /app

# 3️⃣ Copy package files first (to optimize caching)
COPY package.json package-lock.json ./

# 4️⃣ **Force npm to install ALL dependencies**
RUN npm ci

# 5️⃣ Copy all frontend source code
COPY . .

# 6️⃣ ✅ Ensure the frontend actually builds
RUN npm run build && ls -l /app/dist

# 7️⃣ Use NGINX to serve the built frontend
FROM nginx:alpine

# 8️⃣ Copy the built frontend files
COPY --from=builder /app/dist /usr/share/nginx/html

# 9️⃣ Expose port 80
EXPOSE 80

# 🔟 Start NGINX
CMD ["nginx", "-g", "daemon off;"]
