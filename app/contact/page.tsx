export default function ContactPage() {
  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen bg-white px-4 py-8">
        <div className="bg-white rounded-xl shadow p-8 max-w-xl w-full text-center">
          <h1 className="text-3xl font-bold text-purple-700 mb-4">Contact Us</h1>
          <p className="text-gray-600 mb-6">Have questions or feedback? Reach out to us below.</p>
          <form className="space-y-4">
            <input type="text" placeholder="Your Name" className="w-full p-2 border rounded" />
            <input type="email" placeholder="Your Email" className="w-full p-2 border rounded" />
            <textarea placeholder="Your Message" className="w-full p-2 border rounded min-h-[100px]" />
            <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded font-semibold hover:bg-purple-700 transition">Send</button>
          </form>
        </div>
      </main>
    </>
  );
} 