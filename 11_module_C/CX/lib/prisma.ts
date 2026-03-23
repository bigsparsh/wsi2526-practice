import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
import dotenv from "dotenv";
dotenv.config();

const conn = new PrismaMariaDb(process.env.DATABASE_URL || "");
export const prisma = new PrismaClient({adapter: conn});