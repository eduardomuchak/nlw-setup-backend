import 'dotenv/config';
import Fastify from "fastify";

const app = Fastify();
const PORT = Number(process.env.PORT) || 3001;

app.get("/", () => {
  return "Hello World!";
});

app.listen({ port: PORT });
