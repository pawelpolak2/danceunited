import { ShinyText } from '../components/ui'

export default function Contact() {
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Hero / Contact Details Section */}
            <section className="container mx-auto px-4 py-16 text-center">
                <ShinyText as="h1" variant="title" className="mb-12 text-5xl">
                    Contact Us
                </ShinyText>

                <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
                    {/* Phone */}
                    <div className="rounded-xl border border-amber-900/30 bg-gray-900/50 p-8 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 hover:border-gold/50">
                        <div className="mb-4 flex justify-center text-gold">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        </div>
                        <ShinyText as="h3" variant="title" className="mb-2 text-2xl">Phone</ShinyText><br />
                        <a href="tel:+48 797 797 078" className="text-gray-300 hover:text-gold transition-colors text-lg">
                            +48 797 797 078
                        </a>
                    </div>

                    {/* Email */}
                    <div className="rounded-xl border border-amber-900/30 bg-gray-900/50 p-8 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 hover:border-gold/50">
                        <div className="mb-4 flex justify-center text-gold">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </div>
                        <ShinyText as="h3" variant="title" className="mb-2 text-2xl">Email</ShinyText><br />
                        <a href="mailto:info@danceunited.pl" className="text-gray-300 hover:text-gold transition-colors text-lg">
                            info@danceunited.pl
                        </a>
                    </div>

                    {/* Accessibility */}
                    <div className="rounded-xl border border-amber-900/30 bg-gray-900/50 p-8 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 hover:border-gold/50">
                        <div className="mb-4 flex justify-center text-gold">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 8v4"></path>
                                <path d="M12 16h.01"></path>
                            </svg>
                        </div>
                        <ShinyText as="h3" variant="title" className="mb-2 text-2xl">Accessibility</ShinyText>
                        <p className="text-gray-300 text-lg">
                            Wheelchair accessible entrance.<br />
                            Free parking available.
                        </p>
                    </div>
                </div>
            </section>

            {/* Location & Socials Section (Replicated from About) */}
            <section className="border-amber-900/20 border-t bg-black px-4 py-16">
                <div className="container mx-auto">
                    <ShinyText as="h2" variant="title" className="mb-12 text-center text-4xl">
                        Visit Us
                    </ShinyText>

                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Map */}
                        <div className="h-[400px] w-full overflow-hidden rounded-xl border border-amber-900/30 bg-gray-900">
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight={0}
                                marginWidth={0}
                                src="https://maps.google.com/maps?q=aleja+Grunwaldzka+225,+80-266+Gdańsk&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                title="Dance United Location"
                                className="transition-opacity duration-500 hover:opacity-90"
                            ></iframe>
                        </div>

                        {/* Address & Socials Box */}
                        <div className="flex h-[400px] flex-col justify-center space-y-6 rounded-xl border border-amber-900/20 bg-gray-900/40 p-10 text-left backdrop-blur-sm">
                            <div>
                                <ShinyText as="h3" variant="title" className="mb-4 font-cinzel font-semibold text-3xl text-gold">Address</ShinyText>
                                <div className="space-y-2">
                                    <ShinyText as="p" variant="body" className="text-gray-200 text-xl font-medium">aleja Grunwaldzka 225</ShinyText><br />
                                    <ShinyText as="p" variant="body" className="text-gray-400 text-lg">80-266 Gdańsk</ShinyText><br />
                                    <ShinyText as="p" variant="body" className="text-gray-400 text-lg">Poland</ShinyText>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full bg-gradient-to-r from-amber-900/50 via-amber-500/50 to-amber-900/50 my-2"></div>

                            <div>
                                <ShinyText as="h3" variant="title" className="mb-4 font-cinzel font-semibold text-3xl text-gold">Follow Us</ShinyText>
                                <div className="flex gap-6">
                                    <a
                                        href="https://www.facebook.com/danceunitedgdansk"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group transition-all duration-300 hover:scale-110 text-[#1877F2]"
                                        aria-label="Facebook"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="32"
                                            height="32"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                        </svg>
                                    </a>

                                    <a
                                        href="https://www.instagram.com/danceunitedgdansk/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group transition-transform duration-300 hover:scale-110"
                                        aria-label="Instagram"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="32"
                                            height="32"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="url(#instagram-gradient-contact)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <defs>
                                                <linearGradient id="instagram-gradient-contact" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#833AB4" />
                                                    <stop offset="50%" stopColor="#E1306C" />
                                                    <stop offset="100%" stopColor="#F77737" />
                                                </linearGradient>
                                            </defs>
                                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
