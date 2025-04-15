import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Features() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow pt-24">
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
            <div className="space-y-8">
              <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20" />
              </div>
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Process Automation</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Lorem ipsum dolor sit amet, consectetuer adipiscing elit. In rutrum.
                  Fusce tellus odio, dapibus id fermentum quis, suscipit id erat.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20" />
              </div>
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Advanced Data Analysis</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Lorem ipsum dolor sit amet, consectetuer adipiscing elit. In rutrum.
                  Fusce tellus odio, dapibus id fermentum quis, suscipit id erat.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20" />
              </div>
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Team Collaboration</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Lorem ipsum dolor sit amet, consectetuer adipiscing elit. In rutrum.
                  Fusce tellus odio, dapibus id fermentum quis, suscipit id erat.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20" />
              </div>
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Security First</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Lorem ipsum dolor sit amet, consectetuer adipiscing elit. In rutrum.
                  Fusce tellus odio, dapibus id fermentum quis, suscipit id erat.
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