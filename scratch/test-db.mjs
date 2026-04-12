import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function test() {
  try {
    const count = await prisma.user.count();
    console.log("DB OK, Users count:", count);
  } catch (e) {
    console.error("DB FAIL:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
