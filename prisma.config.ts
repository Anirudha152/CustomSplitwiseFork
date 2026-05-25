import path from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma v7 config — typed loosely because the TS types don't expose earlyAccess/migrate yet
const config = {
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    adapter() {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      return new PrismaPg(pool);
    },
  },
};

export default config;
