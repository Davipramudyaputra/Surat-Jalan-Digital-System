import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password || password.length < 12) {
    throw new Error(
      "ADMIN_USERNAME dan ADMIN_PASSWORD (minimal 12 karakter) wajib diisi.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: "ADMIN",
    },
    create: {
      username,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Admin user created/updated with username: ${admin.username}`);
}

main()
  .catch(() => {
    console.error("Provisioning admin gagal. Periksa konfigurasi environment.");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
