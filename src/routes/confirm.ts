import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function confirm(app: FastifyInstance) {
  app.patch("/confirm", async (request, reply) => {
    try {
      const { measure_uuid, confirmed_value } = request.body as {
        measure_uuid: string;
        confirmed_value: string;
      };

      if (!measure_uuid) {
        return reply.status(400).send({
          error_code: "INVALID_DATA",
          error_description: "O campo 'measure_uuid' é obrigatório."
        });
      }

      if (confirmed_value === undefined || confirmed_value === null) {
        return reply.status(400).send({
          error_code: "INVALID_DATA",
          error_description: "O campo 'confirmed_value' é obrigatório."
        });
      }

      const confirmedValueNumber = parseFloat(confirmed_value);

      if (isNaN(confirmedValueNumber)) {
        return reply.status(400).send({
          error_code: "INVALID_DATA",
          error_description:
            "O campo 'confirmed_value' deve ser um número válido."
        });
      }

      const measure = await prisma.measure.findUnique({
        where: {
          measureUuid: measure_uuid
        }
      });

      if (!measure) {
        return reply.status(404).send({
          error_code: "MEASURE_NOT_FOUND",
          error_description: "Leitura não encontrada."
        });
      }

      if (measure.hasConfirmed) {
        return reply.status(409).send({
          error_code: "CONFIRMATION_DUPLICATE",
          error_description: "Leitura já confirmada."
        });
      }

      await prisma.measure.update({
        where: {
          measureUuid: measure_uuid
        },
        data: {
          measureValue: confirmedValueNumber,
          hasConfirmed: true
        }
      });

      return reply.status(200).send({
        success: true,
        message: "Operação realizada com sucesso"
      });
    } catch (error) {
      console.error("Error in /confirm route:", error);
      return reply.status(500).send({
        error_code: "INTERNAL_SERVER_ERROR",
        error_description: "Ocorreu um erro ao processar a solicitação.",
        details: error.message
      });
    }
  });
}
