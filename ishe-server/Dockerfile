FROM node:20

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"] 