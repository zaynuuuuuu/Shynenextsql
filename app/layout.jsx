import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'Shyne Detailing',
  description: 'Book your car detailing appointment online.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
