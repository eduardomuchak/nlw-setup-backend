import 'dotenv/config';
import Fastify from "fastify";
import cors from "@fastify/cors";

import { PrismaClient } from "@prisma/client"

const PORT = Number(process.env.PORT) || 3001;
const app = Fastify();
const prisma = new PrismaClient()

app.register(cors);

app.get("/", async () => {
  const habits = await prisma.habit.findMany();
  return habits;
});

app.listen({ port: PORT }, () => console.log(`Running on port ${PORT}`));
