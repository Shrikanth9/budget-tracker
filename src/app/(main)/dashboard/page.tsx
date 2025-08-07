import CreateAccountDrawer from '@/components/create-account-drawer'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import React from 'react'

const DashboardPage = () => {
  return (
    <>
      <div>
        <h2 className='text-4xl font-bold'>Welcome to your Dashboard</h2>
      </div>


      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <CreateAccountDrawer>
          <Card className='hover:shadow-md transition-shadow cursor-pointer border-dashed'>
             <CardContent className='flex flex-col justify-center items-center
             text-muted-foreground h-full pt-5'>
               <Plus className='w-10 h-10 mb-2'/>
               <p className="text-sm font-medium"> Add new account </p>
             </CardContent>
          </Card>
        </CreateAccountDrawer>
      </div>
    </>
  )
}

export default DashboardPage  