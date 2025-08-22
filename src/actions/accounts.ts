"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializeTransaction } from "@/app/lib/utils";

export async function updateDefaultAccount(accountId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    const account = await db.account.update({
      where: { userId: user.id, id: accountId },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeTransaction(account),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getAccountWithTransactions(accountId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: { userId: user.id, id: accountId },
      include: {
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    return {
      ...serializeTransaction(account),
      transactions: account.transactions.map(serializeTransaction),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function bulkDeleteTransactions(transactionIds: string[]) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        id: {
          in: transactionIds,
        },
        userId: user.id,
      },
    });

    const accountBalanceChanges = transactions.reduce(
      (acc: { [key: string]: number }, transaction: any) => {
        const change =
          transaction.type === "EXPENSE"
            ? transaction.amount
            : -transaction.amount;
        acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
        return acc;
      },
      {}
    );

    await db.$transaction(async (tx: any) => {
        await Promise.all(
          transactionIds.map(id =>
            tx.transaction.delete({
              where: {
                id,
              },
            })
          )
        )

        for (const [accountId, change] of Object.entries(accountBalanceChanges)) {
          await tx.account.update({
            where: { id: accountId },
            data: {
              balance: {
                increment: change
              }
            }
          })
        }
    })

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
