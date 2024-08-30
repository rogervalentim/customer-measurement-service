import { fastify } from "fastify";
import dotenv from "dotenv";
import { upload } from "./routes/upload";
import { confirm } from "./routes/confirm";
import { list } from "./routes/list";

dotenv.config();

const app = fastify();

app.register(upload);
app.register(confirm);
app.register(list);

app.listen({ port: Number(process.env.PORT) }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Servidor rodando em ${address}`);
});
