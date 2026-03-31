import { prisma } from "@/lib/prisma";
import SignClient from "./SignClient";
import { notFound } from "next/navigation";

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const quote = await prisma.quote.findUnique({
    where: { token },
    include: { contact: true },
  });

  if (!quote) {
    notFound();
  }

  return (
    <SignClient
      token={token}
      quote={{
        id: quote.id,
        token: quote.token,
        amount: quote.amount,
        status: quote.status,
        contact: {
          name: quote.contact.name,
          email: quote.contact.email,
        },
      }}
    />
  );
}
