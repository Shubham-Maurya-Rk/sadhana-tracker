import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

// 1. Define a function to create the client
const prismaClientSingleton = () => {
    const adapter = new PrismaMariaDb({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        connectionLimit: 5
    });
    return new PrismaClient({ adapter });
};

// 2. Declare a global type to store the instance
declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// 3. Use the existing instance or create a new one
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export { prisma, prismaClientSingleton };

// 4. In development, save the instance to globalThis
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;