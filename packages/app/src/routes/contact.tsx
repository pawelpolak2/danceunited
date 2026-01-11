import { ShinyText } from '../components/ui'

export default function Contact() {
  return (
    <div className="container mx-auto p-8 text-center">
      <ShinyText as="h1" variant="title" className="mb-8 text-4xl">
        Kontakt
      </ShinyText>
      <ShinyText as="p" variant="body" className="text-xl">
        Skontaktuj się z nami.
      </ShinyText>
    </div>
  )
}
