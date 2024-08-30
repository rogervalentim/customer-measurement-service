import { FastifyInstance } from "fastify";
import { PrismaClient, MeasureType } from "@prisma/client";

const prisma = new PrismaClient();

export async function list(app: FastifyInstance) {
  app.get("/customer/:customerCode/list", async (request, reply) => {
    const { customerCode } = request.params as { customerCode: string };
    const { measure_type } = request.query as { measure_type?: string };

    const validMeasureTypes = Object.values(MeasureType);
    const filterMeasureType = measure_type
      ? measure_type.toUpperCase()
      : undefined;

    if (
      filterMeasureType &&
      !validMeasureTypes.includes(filterMeasureType as MeasureType)
    ) {
      return reply.status(400).send({
        description: "Parâmetro measure type diferente de WATER ou GAS",
        error_code: "INVALID_TYPE",
        error_description: "Tipo de medição não permitida"
      });
    }

    try {
      const customer = await prisma.customer.findUnique({
        where: { code: customerCode }
      });

      if (!customer) {
        return reply.status(404).send({
          description: "Nenhum registro encontrado",
          error_code: "MEASURES_NOT_FOUND",
          error_description: "Nenhuma leitura encontrada"
        });
      }

      const measures = await prisma.measure.findMany({
        where: {
          customerId: customer.id,
          measureType: filterMeasureType
            ? (filterMeasureType as MeasureType)
            : undefined
        },
        select: {
          measureUuid: true,
          measureDateTime: true,
          measureType: true,
          hasConfirmed: true,
          imageUrl: true
        }
      });

      return reply.status(200).send({
        description: "Operação realizada com sucesso",
        customer_code: customerCode,
        measures: measures.map((measure) => ({
          measure_uuid: measure.measureUuid,
          measure_datetime: measure.measureDateTime.toISOString(),
          measure_type: measure.measureType,
          has_confirmed: measure.hasConfirmed,
          image_url: measure.imageUrl
        }))
      });
    } catch (error) {
      console.error(error);
      return reply.status(500).send({
        error_code: "INTERNAL_SERVER_ERROR",
        error_description: "Erro interno do servidor"
      });
    }
  });
}
