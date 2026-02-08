"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function logAuditEvent(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      details: details ?? undefined,
    },
  });
}

export async function getAuditLog(page = 1, filter?: string) {
  await requireAdmin();

  const pageSize = 25;
  const where = filter ? { action: filter } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        admin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((l) => ({
      id: l.id,
      adminName: l.admin.name || l.admin.email,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      details: l.details as Record<string, unknown> | null,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  };
}
