"use client";
import { useState, useRef } from "react";

function validateName(name: string) {
  if (!name) return "Name is required.";
  if (name.length < 4) return "Name must be at least 4 characters.";
  if (name.length > 20) return "Name must be at most 20 characters.";
  return "";
}
function validateEmail(email: string) {
  if (!email) return "Email is required.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Invalid email address.";
  return "";
}
function validateMessage(message: string) {
  if (!message) return "Message is required.";
  if (message.split(/\s+/).filter(Boolean).length > 200) return "Message must be 200 words or less.";
  return "";
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false, message: false });
  const formRef = useRef<HTMLFormElement>(null);

  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const messageError = validateMessage(message);
  const isFormValid = !nameError && !emailError && !messageError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (!isFormValid) return;
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setSuccess("Thank you for reaching out! We'll get back to you soon.");
        setName("");
        setEmail("");
        setMessage("");
        setTouched({ name: false, email: false, message: false });
        formRef.current?.reset();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="bg-white/90 rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <h1 className="text-4xl font-extrabold text-purple-700 mb-2 text-center flex items-center justify-center gap-2">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10.5V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-4.5M21 10.5l-9 6.5-9-6.5" /></svg>
          Contact Us
        </h1>
        <p className="text-gray-600 mb-8 text-center">Have questions or feedback? Reach out to us below.</p>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-start gap-1">
            <label htmlFor="name" className="text-gray-700 text-sm font-medium">Your Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              className={`w-full p-2 border-2 rounded-lg focus:outline-none text-sm bg-white/80 text-black border-purple-200 focus:border-purple-500 ${touched.name && nameError ? 'border-red-400 focus:border-red-500' : ''}`}
              required
              autoComplete="name"
              minLength={4}
              maxLength={20}
            />
            {touched.name && nameError && <span className="text-xs text-red-600 mt-1">{nameError}</span>}
          </div>
          <div className="flex flex-col items-start gap-1">
            <label htmlFor="email" className="text-gray-700 text-sm font-medium">Your Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              className={`w-full p-2 border-2 rounded-lg focus:outline-none text-sm bg-white/80 text-black border-purple-200 focus:border-purple-500 ${touched.email && emailError ? 'border-red-400 focus:border-red-500' : ''}`}
              required
              autoComplete="email"
            />
            {touched.email && emailError && <span className="text-xs text-red-600 mt-1">{emailError}</span>}
          </div>
          <div className="flex flex-col items-start gap-1">
            <label htmlFor="message" className="text-gray-700 text-sm font-medium">Your Message</label>
            <textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, message: true }))}
              className={`w-full p-2 border-2 rounded-lg focus:outline-none text-sm bg-white/80 text-black min-h-[80px] resize-vertical border-purple-200 focus:border-purple-500 ${touched.message && messageError ? 'border-red-400 focus:border-red-500' : ''}`}
              required
              maxLength={2000}
            />
            {touched.message && messageError && <span className="text-xs text-red-600 mt-1">{messageError}</span>}
          </div>
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
          {success && <div className="text-green-600 text-center font-semibold mt-2">{success}</div>}
          {error && <div className="text-red-600 text-center font-semibold mt-2">{error}</div>}
        </form>
      </div>
    </main>
  );
} 