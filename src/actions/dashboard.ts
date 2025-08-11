"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj: any) => {
  const serialized = { ...obj };

  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }

  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }

  return serialized;
};

export async function createAccount(data: any) {
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

    const balanceFloat = parseFloat(data.balance as string);

    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    const existingAccount = await db.account.findMany({
      where: { userId: user.id },
    });

    const shouldBeDefault =
      existingAccount.length === 0 || data.isDefault === "true";

    // If this account should be default, set all other accounts to not default
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await db.account.create({
      data: {
        name: data.name,
        balance: balanceFloat,
        isDefault: shouldBeDefault,
        userId: user.id,
        type: data.type,
      },
    });
    const serializedAccount = serializeTransaction(account);

    revalidatePath("/dashboard");
    return {
      success: true,
      account: serializedAccount,
    };
  } catch (error) {
    console.error("Error creating account:", error);
    throw new Error(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}

export async function getUserAccounts() {
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

    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });
    const serializedAccount = accounts.map(serializeTransaction);
    return serializedAccount;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Error fetching accounts"
    );
  }
}
