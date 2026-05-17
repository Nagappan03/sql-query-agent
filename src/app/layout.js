import './globals.css'
import SessionProvider from '@/components/SessionProvider'

export const metadata = {
  title: 'SQL Query Agent',
  description: 'Natural language to SQL powered by Claude',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}