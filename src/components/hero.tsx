'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from './ui/button'
import { useRef } from 'react'

const HeroSection = () => {
  const imageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const imageElement = imageRef.current as HTMLDivElement;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100; // Adjust this value as needed
      
      if(scrollPosition > scrollThreshold) {
        imageElement.classList.add('scrolled')
      }
      else {
        imageElement.classList.remove('scrolled')
      }
    }
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);

  }, [])

  return (
    <div className='pb-20 px-4'>
        <div className='container mx-auto text-center'>
          <h1 className='text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title'>
            Manage your budget <br /> with AI
          </h1>
          <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
            {" "}
            AI-powered budgeting tools to help you track expenses, set goals, 
            and save money effortlessly.
          </p>
        </div>
        <div className='flex justify-center space-x-4'>
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
          <Link href="#">
            <Button size="lg" variant="outline" className="px-8">
              Watch demo
            </Button>
          </Link>
        </div>
        <div className='hero-image-wrapper'>
          <div ref={imageRef} className='hero-image'>
            <Image 
              src="/banner.jpeg"
              alt="Dashboard preview"
              className='rounded-lg shadow-2xl border mx-auto'
              width={1280}
              height={720}
              priority
            />
          </div>
        </div>
    </div>
  )
}

export default HeroSection;