import Script from "next/script";
import "./globals.css";
import VisitTracker from "@/components/VisitTracker";

export const metadata = {
  metadataBase: new URL("https://tiendanica.store"),
  title: "TiendaNica.store | El Marketplace de Nicaragua",
  description: "Compra y vende en toda Nicaragua - Tiendas, comida a domicilio, y más.",
  openGraph: {
    title: "TiendaNica.store",
    description: "El Marketplace de Nicaragua",
    url: "https://tiendanica.store",
    siteName: "TiendaNica.store",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "TiendaNica.store",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1011358985329179');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body>
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{display:'none'}}
            src="https://www.facebook.com/tr?id=1011358985329179&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
        <VisitTracker />
      </body>
    </html>
  );
}
