import { getDashboardData, getUserAccounts } from '@/actions/dashboard'
import CreateAccountDrawer from '@/components/create-account-drawer'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import React from 'react'
import AccountCard from './_components/account-card'
import { getCurrentBudget } from '@/actions/budgets'
import BudgetProgress from './_components/budget-progress'
import { DashboardOverview } from '../transaction/_components/transaction-overview'

const DashboardPage = async() => {
  const accounts = await getUserAccounts()  

  const defaultAccount = accounts.find((account: any) => account.isDefault)

  let budgetData = null
  if(defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id)
  }  

  const transactions = await getDashboardData();

  return (
    <div className='space-y-8'>
      { defaultAccount && (
         <BudgetProgress 
            initialBudget={budgetData?.budget}
            currentExpenses={budgetData?.currentExpenses || 0}
         />
      )}

      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />
      
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4'>
        <CreateAccountDrawer>
          <Card className='hover:shadow-md transition-shadow cursor-pointer border-dashed'>
             <CardContent className='flex flex-col justify-center items-center
             text-muted-foreground h-full pt-5'>
               <Plus className='w-10 h-10 mb-2'/>
               <p className="text-sm font-medium"> Add new account </p>
             </CardContent>
          </Card>
        </CreateAccountDrawer>

        { accounts.length > 0 && 
           accounts.map((account: any) => {
              return <AccountCard key={account.id} account={account}/>
           })
        }
      </div>
    </div>
  )
}

export default DashboardPage  