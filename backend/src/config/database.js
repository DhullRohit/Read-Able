// Configures and exports the Prisma database client instance with connection settings
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
