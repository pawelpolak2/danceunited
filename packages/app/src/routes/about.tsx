import { ShinyText } from '../components/ui'

export default function About() {
  return (
    <div className="container mx-auto p-8 text-center">
      <ShinyText as="h1" variant="title" className="mb-8 text-4xl">
        O nas
      </ShinyText>
      <ShinyText as="p" variant="body" className="text-xl">
        Tutaj znajdzie się opis naszej szkoły tańca.
      </ShinyText>
    </div>
  )
}
