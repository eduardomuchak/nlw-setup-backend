import 'dotenv/config';
import Fastify from "fastify";
import cors from "@fastify/cors";
import { appRoutes } from './routes';

const PORT = Number(process.env.PORT) || 3001;
const app = Fastify();

app.register(cors);
app.register(appRoutes);

app.listen({ port: PORT }, () => console.log(`Running on port ${PORT}`));
