import { Link } from 'react-router'
import type { MetaArgs } from 'react-router'
import { ShinyText } from '../components/ui'

export function meta(_args: MetaArgs) {
  return [
    { title: 'Polityka Prywatności - Dance United' },
    { name: 'description', content: 'Zasady przetwarzania danych osobowych' },
  ]
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-amber-50">
      <div className="mb-12">
        <ShinyText as="h1" variant="title" className="mb-4 text-4xl text-amber-400">
          Polityka Prywatności
        </ShinyText>
        <p className="text-lg opacity-80">Obowiązuje od dnia 25.01.2026</p>
      </div>

      <div className="prose prose-invert prose-amber max-w-none">
        <h2>§1 Administrator Danych Osobowych</h2>
        <p>
          Administratorem Państwa danych osobowych jest firma DANCE UNITED SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ, z
          siedzibą przy ul. JOACHIMA LELEWELA 48, 61-409 POZNAŃ, wpisana do rejestru przedsiębiorców Krajowego Rejestru
          Sądowego pod numerem KRS: 0000654614, NIP: 7792455144, REGON: 365803012 (dalej: "Administrator").
        </p>
        <p>
          Kontakt z Administratorem możliwy jest pod adresem e-mail: info@danceunited.pl lub pisemnie na adres siedziby.
        </p>

        <h2>§2 Cele i Podstawy Przetwarzania Danych</h2>
        <p>
          Państwa dane osobowe przetwarzane są w następujących celach:
          <br />
          1. <strong>Realizacja usług i umowy</strong> (art. 6 ust. 1 lit. b RODO) – w celu umożliwienia zakupu
          karnetów, zapisu na zajęcia oraz prowadzenia konta użytkownika.
          <br />
          2. <strong>Wypełnienie obowiązków prawnych</strong> (art. 6 ust. 1 lit. c RODO) – m.in. wystawianie faktur,
          prowadzenie księgowości.
          <br />
          3. <strong>Prawnie uzasadniony interes Administratora</strong> (art. 6 ust. 1 lit. f RODO) – dochodzenie
          roszczeń, obrona przed roszczeniami, marketing bezpośredni własnych usług.
        </p>

        <h2>§3 Odbiorcy Danych</h2>
        <p>
          Dostęp do Państwa danych mogą mieć podmioty wspierające nas w prowadzeniu działalności, w szczególności:
          <br />
          1. Dostawcy systemów informatycznych i hostingu.
          <br />
          2. Operatorzy płatności (PayPro SA - Przelewy24).
          <br />
          3. Biuro księgowe.
        </p>

        <h2>§4 Prawa Osób, których Dane Dotyczą</h2>
        <p>
          Przysługuje Państwu prawo do:
          <br />
          1. Dostępu do swoich danych oraz otrzymania ich kopii.
          <br />
          2. Sprostowania (poprawiania) swoich danych.
          <br />
          3. Usunięcia danych, ograniczenia przetwarzania danych.
          <br />
          4. Wniesienia sprzeciwu wobec przetwarzania danych.
          <br />
          5. Przenoszenia danych.
          <br />
          6. Wniesienia skargi do organu nadzorczego (Prezesa Urzędu Ochrony Danych Osobowych).
        </p>

        <h2>§5 Okres Przechowywania Danych</h2>
        <p>
          Państwa dane będą przechowywane przez okres niezbędny do realizacji umowy, a po jej zakończeniu przez czas
          wymagany przepisami prawa podatkowego (5 lat) lub okres przedawnienia roszczeń.
        </p>
      </div>

      <div className="mt-12 border-amber-900/30 border-t pt-8">
        <Link to="/" className="text-amber-400 transition-colors hover:text-amber-300">
          &larr; Powrót na stronę główną
        </Link>
      </div>
    </div>
  )
}
