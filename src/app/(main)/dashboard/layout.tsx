import React, { Suspense } from 'react'
import { BarLoader} from "react-spinners";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='px-5'>
        <h1 className='text-6xl font-bold gradient-title'>Dashboard</h1>
        <Suspense fallback={<BarLoader className='mt-4' width={"100%"} color='#4A90E2'/>}>
          {children}
        </Suspense>
    </div>
  )
}

export default DashboardLayout;