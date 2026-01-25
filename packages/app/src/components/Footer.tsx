import { Link } from 'react-router'

export function Footer() {
  return (
    <footer className="flex-none border-amber-900/20 border-t bg-gray-950 py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 text-gray-400 text-sm md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img src="/logos/logo-transparent.png" alt="Dance United" className="h-8 w-auto opacity-80" />
            <span className="font-bold font-serif text-amber-500 uppercase tracking-wider">Dance United</span>
          </div>
          <p className="opacity-70">
            Professional dance education for everyone. Join our community and discover your passion.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-amber-500 uppercase tracking-wider">Company</h3>
          <ul className="space-y-2">
            <li>DANCE UNITED SP. Z O.O.</li>
            <li>ul. JOACHIMA LELEWELA 48</li>
            <li>61-409 POZNAŃ</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-amber-500 uppercase tracking-wider">Legal</h3>
          <ul className="space-y-2">
            <li>NIP: 7792455144</li>
            <li>KRS: 0000654614</li>
            <li>REGON: 365803012</li>
            <li>
              <Link to="/terms" target="_blank" className="transition-colors hover:text-amber-400">
                Regulamin
              </Link>
            </li>
            <li>
              <Link to="/privacy" target="_blank" className="transition-colors hover:text-amber-400">
                Polityka Prywatności
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-amber-500 uppercase tracking-wider">Contact</h3>
          <ul className="space-y-2">
            <li>
              <a href="mailto:info@danceunited.pl" className="transition-colors hover:text-amber-400">
                info@danceunited.pl
              </a>
            </li>
            <li>
              <a href="tel:797797078" className="transition-colors hover:text-amber-400">
                797 797 078
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-12 border-amber-900/10 border-t pt-8 text-center text-xs opacity-50">
        &copy; {new Date().getFullYear()} DANCE UNITED SP. Z O.O. All rights reserved.
      </div>
    </footer>
  )
}
