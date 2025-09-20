import { getAccountWithTransactions } from "@/actions/accounts";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BarLoader } from "react-spinners";
import AccountChart from "../_components/account-chart";
import TransactionTable from "../_components/transaction-table";

const AccountsPage = async (props: PageProps<'/account/[id]'>) => {
  const { id } = await props.params;
  const accountsData = await getAccountWithTransactions(id);

  if (!accountsData) {
    notFound();
  }

  const { transactions, ...account } = accountsData;

  return (
    <div className="space-y-8 px-5">
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
            Account
          </p>
        </div>

        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            {`${parseFloat(account.balance).toFixed(2)}`}
            <p className="text-sm text-muted-foreground">
              {account._count.transactions} Transactions
            </p>
          </div>
        </div>

      </div>
       <Suspense
          fallback={
            <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
          }
        >
          <AccountChart transactions={transactions} />
        </Suspense> 

        <Suspense
          fallback={
            <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
          }
        >
          <TransactionTable transactions={transactions} />
        </Suspense>
    </div>
  );
};

export default AccountsPage;
