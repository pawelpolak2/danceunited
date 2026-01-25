import { Link } from 'react-router'
import type { MetaArgs } from 'react-router'
import { ShinyText } from '../components/ui'

export function meta(_args: MetaArgs) {
  return [
    { title: 'Regulamin - Dance United' },
    { name: 'description', content: 'Regulamin sklepu i świadczenia usług' },
  ]
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-amber-50">
      <div className="mb-12">
        <ShinyText as="h1" variant="title" className="mb-4 text-4xl text-amber-400">
          Regulamin Organizacyjny i Świadczenia Usług
        </ShinyText>
        <p className="text-lg opacity-80">Dance United Sp. z o.o.</p>
      </div>

      <div className="prose prose-invert prose-amber max-w-none">
        <h2>§1 Postanowienia ogólne</h2>
        <p>
          1. Niniejszy Regulamin określa zasady korzystania z usług świadczonych przez firmę DANCE UNITED SPÓŁKA Z
          OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ, z siedzibą przy ul. JOACHIMA LELEWELA 48, 61-409 POZNAŃ, wpisaną do rejestru
          przedsiębiorców Krajowego Rejestru Sądowego pod numerem KRS: 0000654614, NIP: 7792455144, REGON: 365803012.
        </p>
        <p>
          2. Kontakt ze Sprzedawcą możliwy jest pod adresem e-mail: info@danceunited.pl oraz numerem telefonu: 797 797
          078.
        </p>
        <p>
          3. Regulamin określa w szczególności:
          <br />
          a) rodzaje i zakres usług świadczonych drogą elektroniczną,
          <br />
          b) warunki świadczenia usług drogą elektroniczną,
          <br />
          c) warunki zawierania i rozwiązywania umów o świadczenie usług drogą elektroniczną,
          <br />
          d) tryb postępowania reklamacyjnego.
        </p>

        <h2>§2 Definicje</h2>
        <p>
          Użyte w Regulaminie pojęcia oznaczają:
          <br />
          1. <strong>Klient/Użytkownik</strong> – osoba fizyczna, osoba prawna lub jednostka organizacyjna niebędąca
          osobą prawną, której przepisy szczególne przyznają zdolność prawną, która korzysta z Usług.
          <br />
          2. <strong>Usługodawca/Sprzedawca</strong> – DANCE UNITED SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ.
          <br />
          3. <strong>Karnet/Pakiet</strong> – usługa uprawniająca do udziału w określonej liczbie zajęć tanecznych w
          określonym czasie.
        </p>

        <h2>§3 Usługi i Płatności</h2>
        <p>
          1. Sprzedawca umożliwia zakup Pakietów zajęć za pośrednictwem serwisu internetowego.
          <br />
          2. Ceny podane w serwisie są cenami brutto (zawierają podatek VAT) i wyrażone są w złotych polskich (PLN).
          <br />
          3. Płatności realizowane są za pośrednictwem serwisu Przelewy24 (PayPro SA).
          <br />
          4. Dostępne metody płatności: karty płatnicze, przelewy online, BLIK.
          <br />
          5. Zamówienie zostaje przekazane do realizacji natychmiast po zaksięgowaniu wpłaty.
        </p>

        <h2>§4 Warunki Odstąpienia od Umowy</h2>
        <p>
          1. Konsument, który zawarł umowę na odległość, może od niej odstąpić bez podania przyczyny w terminie 14 dni
          od dnia jej zawarcia.
          <br />
          2. Aby skorzystać z prawa odstąpienia od umowy, Konsument musi poinformować Sprzedawcę o swojej decyzji w
          drodze jednoznacznego oświadczenia (np. pismo wysłane pocztą lub e-mail).
          <br />
          3. W przypadku odstąpienia od umowy Sprzedawca zwraca Konsumentowi wszystkie otrzymane od niego płatności nie
          później niż 14 dni od dnia, w którym Sprzedawca został poinformowany o decyzji Konsumenta.
          <br />
          4. Prawo odstąpienia od umowy nie przysługuje Konsumentowi w odniesieniu do umów o świadczenie usług, za które
          Konsument jest zobowiązany do zapłaty ceny, jeżeli przedsiębiorca wykonał w pełni usługę za wyraźną i
          uprzednią zgodą Konsumenta, który został poinformowany przed rozpoczęciem świadczenia, że po spełnieniu
          świadczenia przez przedsiębiorcę utraci prawo odstąpienia od umowy.
        </p>

        <h2>§5 Reklamacje</h2>
        <p>
          1. Sprzedawca ma obowiązek dostarczyć usługę bez wad.
          <br />
          2. Reklamacje należy składać na adres e-mail: info@danceunited.pl lub pisemnie na adres siedziby firmy.
          <br />
          3. Sprzedawca ustosunkuje się do reklamacji w terminie 14 dni od jej otrzymania.
        </p>

        <h2>§6 Ochrona Danych Osobowych</h2>
        <p>
          1. Administratorem danych osobowych jest DANCE UNITED SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ.
          <br />
          2. Szczegółowe informacje dotyczące przetwarzania danych osobowych znajdują się w{' '}
          <Link to="/privacy" className="text-amber-400 hover:underline">
            Polityce Prywatności
          </Link>
          .
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
