import Navbar from '../../components/Navbar';

export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
    </>
  );
}
