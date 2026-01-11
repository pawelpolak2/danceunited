import { ShinyText, MetallicButton } from '../components/ui'

export default function About() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero / Genesis Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <ShinyText as="h1" variant="title" className="mb-12 text-5xl">
          About Us
        </ShinyText>

        <div className="mx-auto max-w-4xl space-y-8 text-lg">
          <ShinyText as="p" variant="body" className="text-gray-300">
            The story of <span className="text-gold font-semibold">Dance United</span> begins with a passion that started at the age of three.
            Our founder, <span className="text-gold font-semibold">Wiktoria</span>, took her first dance steps at Caro Dance, representing Poland on international stages
            and earning titles such as Polish Champion and European Vice-Champion.
          </ShinyText>
          <ShinyText as="p" variant="body" className="text-gray-300">
            Years of training, discipline, and love for movement evolved into a dream: to create a place where dance is not just a sport,
            but a lifestyle. Dance United was born from this vision—a space where professionals and amateurs alike, regardless of age,
            can discover and nurture their passion in a supportive, energetic environment.
          </ShinyText>
        </div>
      </section>

      {/* Mission Section */}
      <section className="border-amber-900/20 border-y bg-gray-900/30 px-4 py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <ShinyText as="h2" variant="title" className="mb-8 text-3xl">
            Our Mission
          </ShinyText>
          <ShinyText as="p" variant="body" className="text-xl text-gray-300 italic">
            "We believe that dance connects people. Our mission is to build a community where quality instruction meets
            a friendly atmosphere, empowering everyone to express themselves through movement."
          </ShinyText>
        </div>
      </section>

      {/* Founder Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 md:flex-row">
          <div className="w-full md:w-1/2">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-xl border border-amber-900/30 shadow-2xl">
              <img
                src="/img/founder.png"
                alt="Wiktoria - Founder"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
              <div className="absolute bottom-6 left-6 text-left">
                <ShinyText as="h3" variant="title" className="text-3xl">Wiktoria</ShinyText>
                <ShinyText as="p" variant="body" className="text-gold font-cinzel text-sm uppercase tracking-widest">Founder & Head Coach</ShinyText>
              </div>
            </div>
          </div>
          <div className="w-full text-center md:w-1/2 md:text-left">
            <ShinyText as="h2" variant="title" className="mb-6 text-4xl">
              Meet the Founder
            </ShinyText>
            <ShinyText as="p" variant="body" className="mb-6 text-gray-300 text-lg leading-relaxed">
              With a lifetime dedicated to dance, Wiktoria brings world-class experience to Gdańsk.
              Her journey from a young champion to a mentor has shaped the philosophy of Dance United.
              She manages the studio with a heart full of passion, ensuring that every student feels seen, heard, and inspired.
            </ShinyText>
            <div className="flex justify-center gap-4 md:justify-start">
              <div className="h-1 w-24 rounded-full bg-gradient-to-r from-amber-500 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Socials Section */}
      <section className="border-amber-900/20 border-t bg-black px-4 py-16">
        <div className="container mx-auto">
          <ShinyText as="h2" variant="title" className="mb-12 text-center text-4xl">
            Visit Us
          </ShinyText>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Map - Normal Colors */}
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
                      stroke="url(#instagram-gradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <defs>
                        <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
