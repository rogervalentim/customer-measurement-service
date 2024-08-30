import { fastify } from "fastify";
import dotenv from "dotenv";
import { upload } from "./routes/upload";

dotenv.config();

const app = fastify();

app.register(upload);

app.listen({ port: Number(process.env.PORT) }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Servidor rodando em ${address}`);
});
