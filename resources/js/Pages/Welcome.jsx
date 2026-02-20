import { Head, Link } from "@inertiajs/react";

export default function Welcome({ sections = [] }) {
    return (
        <>
            <Head title="Pilates Studio" />
            <div className="min-h-screen bg-slate-50">
                <nav className="sticky top-0 z-40 bg-white border-b border-slate-200">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                        <h1 className="text-xl font-bold text-slate-900">Pilates Studio</h1>
                        <div className="hidden md:flex items-center gap-6">
                            {sections.map((section) => (
                                <a
                                    key={section.id}
                                    href={`#${section.slug}`}
                                    className="text-sm text-slate-600 hover:text-primary-600"
                                >
                                    {section.menu_label}
                                </a>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/login" className="text-sm text-slate-700 hover:text-primary-600">Login</Link>
                            <Link href="/register" className="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm hover:bg-primary-600">Register</Link>
                        </div>
                    </div>
                </nav>

                <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
                    {sections.map((section) => (
                        <section id={section.slug} key={section.id} className="scroll-mt-24 bg-white border border-slate-200 rounded-2xl p-8">
                            <p className="text-xs uppercase tracking-widest text-primary-600 mb-2">{section.menu_label}</p>
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">{section.title}</h2>
                            <p className="text-slate-600 leading-relaxed">{section.content}</p>
                        </section>
                    ))}
                </main>
            </div>
        </>
    );
}
