export default function AboutPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="bg-white/90 rounded-2xl shadow-xl p-4 sm:p-8 max-w-6xl w-full mx-auto">
        <h1 className="text-4xl font-extrabold text-purple-700 mb-4 text-center flex items-center justify-center gap-2">
          {/* <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> */}
          Our Story
        </h1>
        <div className="text-gray-700 text-base md:text-lg leading-relaxed space-y-6">
          <section>
            <p className="text-gray-800 font-semibold text-lg mb-2">It all started with a sprint demo.</p>
            <p>The QA lead pointed out something odd — the meta description on the UAT build was showing &quot;Lorem Ipsum.&quot; Everyone laughed. But when we pushed to production and saw that the title tag still said &quot;Test Page&quot;, it wasn&#39;t funny anymore.</p>
          </section>
          <section className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
            <p className="mb-2">We were a team of developers and testers working on fast-moving websites with weekly (sometimes daily) releases. Clients expected perfect pages — optimized, clean, and SEO-ready. But in the chaos of deployments, the SEO tags were often overlooked. Not because we didn’t care, but because there was no simple way to validate them at scale.</p>
            <p className="italic text-purple-700">Every dev, tester, and SEO manager knows this pain:</p>
            <ul className="list-none space-y-1 mt-2">
              <li className="flex items-center gap-2"><span className="text-yellow-500">⚠️</span> Did the canonical tag point to staging instead of production?</li>
              <li className="flex items-center gap-2"><span className="text-blue-500">🔖</span> Did we forget the OG tags on that one landing page?</li>
              <li className="flex items-center gap-2"><span className="text-green-500">🔄</span> Is the UAT SEO matching what&#39;s in live?</li>
              <li className="flex items-center gap-2"><span className="text-pink-500">📝</span> Did the new build override marketing’s meta updates?</li>
            </ul>
          </section>
          <section>
            <p>We tried browser extensions, we wrote custom scripts, we even used Postman — but nothing felt right.</p>
            <p className="font-bold text-purple-700 mt-4 flex items-center gap-2"><span className="text-2xl">🚀</span> So we built it.</p>
          </section>
          <section className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
            <p className="mb-2">A simple tool that lets you:</p>
            <ul className="list-none space-y-2">
              <li className="flex items-center gap-2"><span className="text-green-600 text-xl">🟢</span> <span>Check SEO tags across multiple environments</span></li>
              <li className="flex items-center gap-2"><span className="text-purple-600 text-xl">🟣</span> <span>Compare UAT vs Production for every page</span></li>
              <li className="flex items-center gap-2"><span className="text-blue-600 text-xl">✅</span> <span>Share clear, readable SEO snapshots with stakeholders</span></li>
            </ul>
            <p className="mt-2 text-gray-600 text-sm">No DevOps pipelines. No manual copy-pasting source code. Just clean, visual SEO comparison — instantly.</p>
          </section>
          <section>
            <p>What began as an internal utility became something our SEO teams loved. Testers started catching regressions before releases. Clients started trusting our QA process more. And we started shipping SEO-perfect pages with confidence.</p>
          </section>
          <section className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500 shadow-md">
            <p className="font-bold text-green-700 flex items-center gap-2 text-xl mb-3">
              <span className="text-3xl">🚀</span> Powering Fast-Moving Teams & Startups
            </p>
            <p className="text-gray-800 leading-relaxed">
              Today, we&#39;re helping <span className="font-semibold text-green-600">10+ startups</span> ship SEO-optimized pages with confidence —
              serving over <span className="font-semibold text-green-600">1,000 users</span> and growing fast.
            </p>
            <p className="text-gray-800 leading-relaxed">
              If you&#39;ve ever heard that on deployment day, this tool was made for you.
              We’re scaling quickly — because the market loves SEO as much as we do.
            </p>
          </section>
          <section>
            <p className="font-bold text-purple-700 mt-4">We believe SEO should be part of the build process, not an afterthought.<br />We&#39;re here to make that easy — one page at a time.</p>
          </section>
        </div>
      </div>
    </main>
  );
} 