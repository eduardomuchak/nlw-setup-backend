import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appRoutes } from './routes';

const app = Fastify();

app.register(cors, {
  origin: '*',
});
app.register(appRoutes);

// const ip = require('ip');

app
  .listen({
    port: Number(process.env.PORT),
    // host: ip.address(),
  })
  .then(() => {
    console.log(`HTTP Server running on Port:${process.env.PORT}`);
  });
