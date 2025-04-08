import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Features() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow pt-24">
        {/* Features sekce */}
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
            {/* Feature 1 */}
            <div className="space-y-8">
              <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                {/* Zde bude obrázek feature */}
                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20" />
              </div>
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Process Automation</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Simplify your work with our automation tools. Set up custom workflows, 
                  automatic updates, and let the application work for you. Save time and focus 
                  on what really matters.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="space-y-8">
              <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20" />
              </div>
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Advanced Data Analysis</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Gain deeper insights into your data with our analytics tools. Visualize trends, 
                  identify patterns, and make informed decisions based on real data.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="space-y-8">
              <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20" />
              </div>
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Team Collaboration</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Collaborate effectively with your team in real-time. Share documents, 
                  communicate through integrated chat, and track project progress together.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="space-y-8">
              <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20" />
              </div>
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Security First</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Your data is safe with us. We use state-of-the-art encryption technologies, 
                  regular security audits, and a comprehensive data backup system.
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