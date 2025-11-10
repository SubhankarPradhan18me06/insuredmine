module.exports = {
  apps: [
    {
      name: 'insuredmine',
      script: 'server.js',
      args: '',
      // use fork mode (worker threads and mongoose prefer single-process unless you explicitly handle multi-process)
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 8600
      }
    }
  ]
};
