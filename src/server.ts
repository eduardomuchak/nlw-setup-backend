import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appRoutes } from './routes';

const app = Fastify();

app.register(cors, {
  origin: '*',
});
app.register(appRoutes);

app
  .listen({
    port: 8080,
    // host: '0.0.0.0',
  })
  .then(() => {
    console.log('HTTP Server running on Port 8080!');
  });
