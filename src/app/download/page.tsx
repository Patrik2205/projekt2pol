'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

type SoftwareVersion = {
  id: number
  versionNumber: string
  downloadUrl: string
  checksum: string
  sizeBytes: number | string // Handle both number and string (from BigInt)
  releaseDate: string
  isLatest: boolean
  minRequirements: string | null
  changelog: string | null
  releasePost: {
    id: number
    title: string
    slug: string
  } | null
}

export default function DownloadPage() {
  const [versions, setVersions] = useState<SoftwareVersion[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadStarted, setDownloadStarted] = useState<number | null>(null);

  useEffect(() => {
    async function fetchVersions() {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/software');
        
        if (!response.ok) {
          throw new Error(`Failed to load software versions (status ${response.status})`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format from server');
        }
        
        setVersions(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching software versions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load software versions');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchVersions();
  }, []);

  const toggleExpandVersion = (versionId: number) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  }

  const handleDownload = async (versionId: number) => {
    try {
      setDownloadStarted(versionId);
      
      const response = await fetch('/api/software/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ versionId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate download');
      }
      
      const data = await response.json();
      
      // Create an invisible anchor to trigger the download
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = `application-${versions.find(v => v.id === versionId)?.versionNumber}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error initiating download:', err);
      alert('Download failed. Please try again later.');
    } finally {
      setDownloadStarted(null);
    }
  }

  const formatFileSize = (bytes: number | string) => {
    // Convert bytes to a number if it's a string (from BigInt)
    const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    
    if (numBytes < 1024) return `${numBytes} B`;
    if (numBytes < 1024 * 1024) return `${(numBytes / 1024).toFixed(2)} KB`;
    if (numBytes < 1024 * 1024 * 1024) return `${(numBytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(numBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Get the latest version
  const latestVersion = versions.find(v => v.isLatest);
  // Get all other versions sorted by release date
  const olderVersions = versions
    .filter(v => !v.isLatest)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-center mb-12">Download Our Software</h1>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900 p-6 rounded-xl text-center">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Downloads</h2>
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>              
              {/* Latest version section */}
              {latestVersion && (
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-12">
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <div className="flex items-center">
                          <h2 className="text-2xl font-bold">Latest Version: {latestVersion.versionNumber}</h2>
                          <span className="ml-3 px-2.5 py-0.5 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs font-medium rounded-full">
                            Latest
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                          Released on {formatDate(latestVersion.releaseDate)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(latestVersion.id)}
                        disabled={downloadStarted === latestVersion.id}
                        className={`px-6 py-3 rounded-md text-white font-medium text-lg ${
                          downloadStarted === latestVersion.id
                            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                      >
                        {downloadStarted === latestVersion.id ? 'Downloading...' : 'Download Now'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</h3>
                        <p className="mt-1 text-lg font-semibold">{formatFileSize(latestVersion.sizeBytes)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Checksum (SHA-256)</h3>
                        <p className="mt-1 text-sm font-mono overflow-hidden text-ellipsis">{latestVersion.checksum}</p>
                      </div>
                    </div>
                    
                    {latestVersion.minRequirements && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-2">System Requirements</h3>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <p className="whitespace-pre-line">{latestVersion.minRequirements}</p>
                        </div>
                      </div>
                    )}
                    
                    {latestVersion.changelog && (
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-2">What's New</h3>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <p className="whitespace-pre-line">{latestVersion.changelog}</p>
                        </div>
                      </div>
                    )}
                    
                    {latestVersion.releasePost && (
                      <div className="mt-6">
                        <Link 
                          href={`/blog/${latestVersion.releasePost.slug}`}
                          className="text-primary-600 hover:text-primary-500"
                        >
                          Read the full release notes: {latestVersion.releasePost.title}
                        </Link>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Previous versions section */}
              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold">Previous Versions</h2>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {olderVersions.length > 0 ? (
                    olderVersions.map(version => (
                      <div key={version.id} className="px-6 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-medium">Version {version.versionNumber}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Released on {formatDate(version.releaseDate)} • {formatFileSize(version.sizeBytes)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleDownload(version.id)}
                              disabled={downloadStarted === version.id}
                              className={`px-4 py-2 rounded-md text-white ${
                                downloadStarted === version.id
                                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                  : 'bg-primary-600 hover:bg-primary-700'
                              }`}
                            >
                              {downloadStarted === version.id ? 'Downloading...' : 'Download'}
                            </button>
                            
                            <button
                              onClick={() => toggleExpandVersion(version.id)}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              {expandedVersions.has(version.id) ? (
                                <span>▲ Less</span>
                              ) : (
                                <span>▼ More</span>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {expandedVersions.has(version.id) && (
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Checksum (SHA-256)</h4>
                                <p className="text-sm font-mono break-all">{version.checksum}</p>
                              </div>
                              
                              {version.minRequirements && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">System Requirements</h4>
                                  <p className="whitespace-pre-line">{version.minRequirements}</p>
                                </div>
                              )}
                              
                              {version.changelog && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Changelog</h4>
                                  <p className="whitespace-pre-line">{version.changelog}</p>
                                </div>
                              )}
                              
                              {version.releasePost && (
                                <div>
                                  <Link 
                                    href={`/blog/${version.releasePost.slug}`}
                                    className="text-primary-600 hover:text-primary-500 text-sm"
                                  >
                                    Read the full release notes
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No previous versions available.
                    </div>
                  )}
                </div>
              </section>

              {/* Additional information section */}
              <section className="mt-12 mb-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">Download Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Verifying Your Download</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        We provide SHA-256 checksums for all our downloads. To verify your download, compare the checksum of your downloaded file with the one displayed on this page.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-1">Installation Instructions</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        After downloading, extract the ZIP file and run the installer. Follow the on-screen instructions to complete the installation.
                      </p>
                      <Link 
                        href="/docs?section=installation-guide"
                        className="text-primary-600 hover:text-primary-500 text-sm"
                      >
                        View detailed installation guide →
                      </Link>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-1">Need Help?</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        If you encounter any issues with downloading or installing the software, please visit our documentation or contact our support team.
                      </p>
                      <div className="flex space-x-4 mt-2">
                        <Link 
                          href="/docs?section=troubleshooting"
                          className="text-primary-600 hover:text-primary-500 text-sm"
                        >
                          Troubleshooting guide →
                        </Link>
                        <Link 
                          href="/contact"
                          className="text-primary-600 hover:text-primary-500 text-sm"
                        >
                          Contact support →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}