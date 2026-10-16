import './globals.css';

export const metadata = {
  title: 'Songkran 2027 Travel Dashboard',
  description: 'เปรียบเทียบงบหนีร้อน + จุดวิ่ง Trail/City (CNX Departure)'
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans min-h-screen p-4 md:p-6 lg:p-8">{children}</body>
    </html>
  );
}
