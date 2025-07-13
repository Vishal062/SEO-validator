export default function ContactPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 max-w-xl w-full text-center">
        <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-4">Contact Us</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Have questions or feedback? Reach out to us below.</p>
        <form className="space-y-4">
          <input type="text" placeholder="Your Name" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" />
          <input type="email" placeholder="Your Email" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" />
          <textarea placeholder="Your Message" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[100px]" />
          <button type="submit" className="bg-purple-600 dark:bg-purple-500 text-white px-6 py-2 rounded font-semibold hover:bg-purple-700 dark:hover:bg-purple-600 transition">Send</button>
        </form>
      </div>
    </main>
  );
} 