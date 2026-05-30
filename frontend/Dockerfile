FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build for production
RUN npm run build

# Install serve
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Serve built app
CMD ["serve", "-s", "build", "-l", "3000"]
