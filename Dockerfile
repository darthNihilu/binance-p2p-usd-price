FROM node:16

WORKDIR /usr/src/app

# Copy the application code to the container
COPY . .

# Install the dependencies
RUN npm install

# Change the ownership of the working directory to the non-privileged node user
RUN chown -R node:node /usr/src/app

# Switch to the non-privileged node user
USER node

# Specify the command to run when the container is started
CMD ["npm", "run", "start:dev"]
