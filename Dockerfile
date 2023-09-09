# Use an official Node.js runtime as a parent image
FROM node:18-alpine3.16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application source code to the container
COPY . .

# Expose a port (replace 3000 with the port your Express app listens on)
EXPOSE 8081

# Start the application
CMD ["node", "server.js"]
