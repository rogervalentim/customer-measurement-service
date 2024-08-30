import { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import { generateNumericValue } from "../services/gemini";
import { processImage } from "../utils/process-image";
import { imageDirectory } from "../utils/image-directory";

export async function upload(app: FastifyInstance) {
  app.post("/upload", async (request, reply) => {
    try {
      const { image, customer_code, measure_datetime, measure_type } =
        request.body as {
          image: string;
          customer_code: string;
          measure_datetime?: string;
          measure_type: "WATER" | "GAS";
        };

      const base64Regex = /^[A-Za-z0-9+/=]+$/;

      if (!base64Regex.test(image) || !customer_code || !measure_type) {
        return reply.status(400).send({
          description:
            "Os dados fornecidos no corpo da requisição são inválidos",
          error_code: "INVALID_DATA",
          error_description: "Dados fornecidos são inválidos"
        });
      }

      const customer = await prisma.customer.findUnique({
        where: { code: customer_code }
      });

      if (!customer) {
        return reply.status(404).send({
          error_code: "CUSTOMER_NOT_FOUND",
          error_description: "Cliente não encontrado."
        });
      }

      const measureDate = measure_datetime
        ? new Date(measure_datetime)
        : new Date();
      const startOfMonth = new Date(
        measureDate.getFullYear(),
        measureDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        measureDate.getFullYear(),
        measureDate.getMonth() + 1,
        0
      );

      const existingReading = await prisma.measure.findFirst({
        where: {
          customerId: customer.id,
          measureType: measure_type,
          measureDateTime: { gte: startOfMonth, lt: endOfMonth }
        }
      });

      if (existingReading) {
        return reply.status(409).send({
          description: "Já existe uma leitura para este tipo no mês atual",
          error_code: "DOUBLE_REPORT",
          error_description: "Leitura do mês já realizada"
        });
      }

      const filename = await processImage(image, imageDirectory);
      const imageUrl = `${request.protocol}://${request.hostname}/images/${filename}`;

      const measureValueText = await generateNumericValue(image);

      const measureUuid = uuidv4();

      await prisma.measure.create({
        data: {
          customerId: customer.id,
          measureType: measure_type,
          measureDateTime: measureDate,
          measureValue: measureValueText,
          imageUrl: imageUrl,
          measureUuid: measureUuid
        }
      });

      return reply.status(200).send({
        description: "Operação realizada com sucesso",
        image_url: imageUrl,
        measure_value: measureValueText,
        measure_uuid: measureUuid
      });
    } catch (error) {
      console.error("Error in /upload route:", error);
      return reply.status(500).send({
        error_code: "INTERNAL_SERVER_ERROR",
        error_description: "Ocorreu um erro ao processar a solicitação.",
        details: error.message
      });
    }
  });
}
