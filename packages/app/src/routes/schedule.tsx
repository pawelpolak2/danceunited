import { ShinyText } from '../components/ui'

export default function Schedule() {
  return (
    <div className="container mx-auto p-8 text-center">
      <ShinyText as="h1" variant="title" className="mb-8 text-4xl">
        Grafik
      </ShinyText>
      <ShinyText as="p" variant="body" className="text-xl">
        Sprawdź grafik zajęć.
      </ShinyText>
    </div>
  )
}
