import Link from 'next/link';
import React from 'react'
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 *:text-center">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page Not Found</p>
        <p className="mt-2 text-gray-500">The page you are looking for does not exist.</p>
        <Link href="/" className="mt-6">
          <Button>
            Go back to Home
          </Button>
        </Link>
    </div>
  )
}

export default NotFound