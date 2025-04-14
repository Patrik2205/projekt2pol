import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <div className="min-h-[56vh] relative flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-background to-background/50" />
          </div>
          
          <div className="relative max-w-7xl mx-auto pt-32 pb-24">
            <div className="text-center">
              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                VašeAplikace
              </h1>
              <p className="mt-8 text-xl sm:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Jednoduchý a výstižný slogan vaší aplikace. Například: Revoluční nástroj pro vývojáře.
              </p>
              <div className="mt-12 flex justify-center gap-6">
                <Link
                  href="/download"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
                >
                  Download
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center px-8 py-4 border border-gray-300 dark:border-gray-700 text-lg font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="py-16 pb-[200px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-64">
              <div className="w-full md:w-1/2">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg w-full">
                </div>
              </div>
              <div className="w-full md:w-1/2 md:pl-8">
                <h2 className="text-3xl font-bold mb-4">První hlavní funkce</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Detailní popis první funkce vaší aplikace. Zde můžete podrobně vysvětlit, 
                  jak tato funkce pomáhá uživatelům a co ji dělá výjimečnou.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-64">
              <div className="w-full md:w-1/2">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg w-full">
                </div>
              </div>
              <div className="w-full md:w-1/2 md:pr-8">
                <h2 className="text-3xl font-bold mb-4">Druhá hlavní funkce</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Detailní popis druhé funkce vaší aplikace. Vysvětlete zde, jaké problémy 
                  tato funkce řeší a jaké výhody přináší uživatelům.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg w-full">
                </div>
              </div>
              <div className="w-full md:w-1/2 md:pl-8">
                <h2 className="text-3xl font-bold mb-4">Třetí hlavní funkce</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Detailní popis třetí funkce vaší aplikace. Popište zde jedinečné vlastnosti 
                  této funkce a jak může být využita v praxi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
