// Include it and extract some methods for convenience
const server = require('server');
const { get, post } = server.router;

// Launch server with options and a couple of routes
server({
  port: process.env.PORT || 8080
}, [
  get('/', () => 'Hello world'),
  post('/data', ctx => {
    console.log(ctx.data);
    return 'ok';
  })
]);
