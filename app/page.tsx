import Image from "next/image";
import NavBar from "./NavBar";
import Head from "next/head";
import React from "react";
import Chart from "./components/Chart";

export default function Home() {
  return (
    <>
      <Head>
        <title>Chart Module</title>
        <meta name="description" content="Chart Module" />
      </Head>

      <main className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <NavBar />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-colors duration-300">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-4 text-center text-gray-900 dark:text-white">Akhil's GoQuant Charting Module</h2>
              <Chart />
            </div>
          </div>
        </div>
        <footer className="bg-gray-200 dark:bg-gray-700 text-center p-4 mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">&copy; {new Date().getFullYear()} Akhil. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
}
