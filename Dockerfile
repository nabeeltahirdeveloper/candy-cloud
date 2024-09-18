# Step 1: Use an official Node.js runtime as a parent image
FROM node:18 AS build

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy the package.json and package-lock.json files
COPY package*.json ./

# Step 4: Install dependencies with legacy peer deps flag
RUN npm install --legacy-peer-deps

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Build the application
RUN npm run build

# Step 7: Use an official Nginx image to serve the built app
FROM nginx:stable-alpine

# Step 8: Copy the built app from the previous stage to Nginx's web root
COPY --from=build /app/dist /usr/share/nginx/html

# Step 9: Expose the port on which Nginx runs
EXPOSE 80

# Step 10: Start Nginx
CMD ["nginx", "-g", "daemon off;"]
