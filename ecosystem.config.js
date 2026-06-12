module.exports = {
  apps: [
    {
      name: "nova-store",
      script: "server/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_restarts: 10,
      autorestart: true,
    },
  ],
};
