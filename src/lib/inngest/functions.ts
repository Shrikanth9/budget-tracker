import { inngest } from "./client";
import { db } from "../prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/../emails/template";
import { GoogleGenerativeAI } from "@google/generative-ai";

function calculateNextRecurringDate(
  startDate: Date,
  interval: string
): Date | null {
  const date = new Date(startDate);
  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
    default:
      return null;
  }
  return date;
}

export const checkBudgetAlert = inngest.createFunction(
  { 
    id: "check-budget",
    name: "Check budget alerts" 
  },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
     const budgets = await step.run("fetch-budget", async () => {
        return await db.budget.findMany({
            include: {
                user: {
                    include: {
                        accounts: {
                            where: {
                                isDefault: true
                            }
                        }
                    }
                }
            }
        })
     })
     for(const budget of budgets) {
        const defaultAccount = budget.user.accounts[0];
        if(!defaultAccount) continue;

           await step.run(`check-budget-${budget.id}`, async() => {
            
            const currentDate = new Date();
            currentDate.setDate(1);

            const expenses = await db.transaction.aggregate({
                where: {
                    userId: budget.userId,
                    accountId: defaultAccount.id,
                    type: 'EXPENSE',
                    date: {
                        gte: currentDate
                    }
                },
                _sum: {
                    amount: true
                }
            })

            const totalExpenses = expenses._sum.amount?.toNumber() || 0;
            const budgetAmount = parseFloat(budget.amount);
            const percentUsed = ( totalExpenses / budgetAmount ) * 100;
            

            if(percentUsed>=80 && (!budget.lastAlertSent || 
                isNewMonth(new Date(budget.lastAlertSent), new Date()))) {

                await sendEmail({
                    to: budget.user.email,
                    subject: `Budget Alert for ${defaultAccount.name}`,
                    type: 'budget-alert',
                    react: EmailTemplate({
                       userName: defaultAccount.name,
                       data: {
                          percentageUsed: percentUsed,
                          budgetAmount: parseInt(budgetAmount.toFixed(2)),
                          totalExpenses: parseInt(totalExpenses.toFixed(2)),
                          accountName: defaultAccount.name
                       }
                    })
                })

                await db.budget.update({
                    where: { id: budget.id},
                    data: {
                        lastAlertSent: new Date()
                    }
                })
            }
     })
    }
  }
);


function isNewMonth(lastAlertDate: Date, currentDate: Date) {
    return (
        lastAlertDate.getMonth() !== currentDate.getMonth() || 
        lastAlertDate.getFullYear() !== currentDate.getFullYear()
    )
}

export const triggerRecurringTransactions = inngest.createFunction({
  id: "trigger-recurring-transactions",
  name: "Trigger Recurring Transactions"
}, { cron: '0 0 * * *' }, async ({ step }) => {
    const recurringTransactions = await step.run('fetch-recurring-transactions', async () => {
        return await db.transaction.findMany({
            where: {
                isRecurring: true,
                status: 'COMPLETED',
                OR: [
                   { lastProcessed: null },
                   { nextRecurringDate: { lte: new Date() } }
                ]
            },
        })
    })

    if(recurringTransactions.length > 0) {
       const events = recurringTransactions.map((rt: any) => ({
          name: "transaction.recurring.process",
          data: { transactionId: rt.id, userId: rt.userId }
       }))

       await inngest.send(events)
    }

    return { triggered: recurringTransactions.length }
})

export const processRecurringTransaction = inngest.createFunction({
  id: "process-recurring-transaction",
  throttle: {
    limit: 10,
    period: "1m",
    key: "event.data.userId"
  }
}, { event: "transaction.recurring.process" }, async ({ event, step }) => {
    const { transactionId, userId } = event.data;
    if(!transactionId || !userId) {
        console.error("Missing transactionId or userId in event data");
        return { error: "Missing transactionId or userId in event data" }
    }
    
    await step.run("process-transaction", async () => {
       const transaction = await db.transaction.findUnique({
          where: {
             id: event.data.transactionId,
             userId: event.data.userId
          },
          include: {
              account: true
          }
       })

       if(!transaction || !isTransactionDue(transaction)) return;

       await db.$transaction(async (tx: any) => {
          const newTransaction = await tx.transaction.create({
             data: {
                type: transaction.type,
                amount: transaction.amount,
                description: `${transaction.description} (Recurring)`,
                date: new Date(),
                category: transaction.category,
                userId: transaction.userId,
                accountId: transaction.accountId,
                isRecurring: false,
            }
          })

          const balanceAdjustment = transaction.type === "EXPENSE" ? -transaction.amount.toNumber() : transaction.amount.toNumber();

          await tx.account.update({
             where: { id: transaction.accountId },
             data: {
                balance: { increment: balanceAdjustment }
             }
          })

         await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              lastProcessed: new Date(),  
              nextRecurringDate: calculateNextRecurringDate(new Date(), transaction.recurringInterval)
            }
         })
        })
    })
})

function isTransactionDue(transaction: any) {
    if(!transaction.lastProcessed) return true;

    const today = new Date();
    return new Date(transaction.nextRecurringDate) <= today;
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: 'generate-monthly-reports',
    name: 'Generate Monthly Reports',
  },
  {
    cron: '0 0 1 * *'
  }, 
  async ({ step }) => {
    const users = await step.run('fetch-users', async () => {
      return await db.user.findMany({
        include: {
          accounts: true
        }
      })
    })
    for(const user of users) {
        await step.run(`generate-report-${user.id}`, async () => {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1)


            const stats = await getMonthlyStats(user.id, lastMonth) 
            const monthName = lastMonth.toLocaleString("default", {
                month: 'long'
            })

            const insights = await generateFinancialInsights(stats, monthName);

            await sendEmail({
                    to: user.email,
                    subject: `Monthly financial report for ${monthName}`,
                    react: EmailTemplate({
                       userName: user.name,
                       type: 'monthly-report',
                       data: {
                          stats,
                          month: monthName,
                          insights
                       }
                    })
            })
        })
            
    }
    return { processed: users.length }
  }

)

async function generateFinancialInsights(stats: any, month: string) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);   
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash'})

    const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

const getMonthlyStats = async (userId: string, month: Date) => {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const transactions = await db.transaction.findMany({
        where: {
            userId,
            date: {
                lte: startDate,
                gte: endDate
            }
        }
    })


    return transactions.reduce(
        (stats: any, t: any) => {
             const amount = t.amount.toNumber();
             if(t.type === "EXPENSE") {
                stats.totalExpenses += amount;
                stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount
             }
             else {
                stats.totalIncome += amount
             }
             return stats;
        },
        {
            totalExpenses: 0,
            totalIncome: 0,
            byCategory: {},
            transactionCount: transactions.length
        }
    )
}