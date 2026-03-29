import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // מוצאים את הארגון של המשתמש המחובר
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // יוצרים חשבונית ולקוח דמה
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: user.organizationId,
        amount: 250,
        status: 'PENDING',
        description: 'חשבונית בדיקה ראשונה',
        invoiceNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
        customerName: 'לקוח בדיקה א',
        customerEmail: 'test@example.com',
      }
    });

    return NextResponse.json({ success: true, message: 'Test invoice created!', invoice });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}