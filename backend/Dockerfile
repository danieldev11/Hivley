# Use node.js image
FROM node:20

# Set /app as the working dir
WORKDIR /app

# copy these first (better for caching)
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy rest of backend files
COPY . . 

# Expose application Port
EXPOSE 3000

# Define env variables
ENV NODE_ENV=production \
    PORT=3000


CMD [ "npm", "start" ]