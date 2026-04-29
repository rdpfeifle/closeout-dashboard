import type { AppProps } from "next/app";
import Head from "next/head";
import "@/app/globals.css";
import { Providers } from "@/app/providers";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Head>
        <title>Closeout - Construction Project Tracker</title>
        <meta name="description" content="Closeout - Construction Project Tracker" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <Component {...pageProps} />
    </Providers>
  );
}
