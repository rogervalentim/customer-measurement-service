import { fastify } from "fastify";
import dotenv from "dotenv";

dotenv.config();

const app = fastify();

app.listen({ port: Number(process.env.PORT) }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Servidor rodando em ${address}`);
});
