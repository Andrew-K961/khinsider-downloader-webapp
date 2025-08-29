# Use Alpine Linux as the base image
FROM alpine:3.18

# Define build arguments for UID and GID with default values
ARG PUID=1000
ARG PGID=1000

# Install necessary packages: Python 3.8, Node.js 18, and build dependencies
# 'build-base' is needed for compiling some Python/Node.js packages that have native extensions.
# 'py3-pip' for Python's package manager
# 'nodejs' and 'npm' for Node.js and its package manager
# The --no-cache flag keeps the image size small by removing package indexes.
RUN apk add --no-cache \
    python3 \
    py3-pip \
    nodejs \
    npm \
    build-base

# Create the system group first with the specified GID
RUN addgroup -S -g ${PGID} appusergroup

# Create the system user with the specified UID, add to the new group,
# set home directory, and disable password login for security.
RUN adduser -S -u ${PUID} -G appusergroup -s /bin/bash -h /khd/app appuser

# Set environment variable for Node.js production mode
ENV NODE_ENV=production

# Set the initial working directory for build steps
WORKDIR /khd/app

# Copy package.json and package-lock.json* for Node.js dependencies
# This allows Docker's build cache to be used effectively.
COPY ["package.json", "package-lock.json*", "./"]

# Install Node.js production dependencies
# 'npm install --production --silent' installs only production dependencies quietly.
# 'mv node_modules ../' moves node_modules to the parent directory to prevent it from being copied
# into the final /khd/app directory when `COPY . .` happens, keeping the app directory clean.
RUN npm install --production --silent && mv node_modules ../

# Install Python dependencies (BeautifulSoup 4)
# Note: For a real project, you'd typically have a requirements.txt file
# and use `pip install -r requirements.txt`.
RUN pip install bs4

# Copy the rest of your application files.
# The `node_modules` are now in `/khd/node_modules` and won't be overwritten.
COPY . .

# Expose port 3000 for inter-container communication (not to the host by default)
EXPOSE 3000

# Set permissions for the entire application directory structure to the non-root user.
# This ensures the 'appuser' can read and write all necessary files.
RUN chown -R appuser:appusergroup /khd

# Remove development dependencies for Node.js (if any were installed earlier)
# This helps keep the final image size smaller.
RUN npm prune --production

# Switch to the non-root user for running the application
USER appuser

# Define the command to start your webserver
CMD ["npm", "start"]

# Healthcheck to ensure the application is running and responsive
HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1