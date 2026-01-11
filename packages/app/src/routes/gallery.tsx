import { ShinyText } from '../components/ui'

export default function Gallery() {
  return (
    <div className="container mx-auto p-8 text-center">
      <ShinyText as="h1" variant="title" className="mb-8 text-4xl">
        Galeria
      </ShinyText>
      <ShinyText as="p" variant="body" className="text-xl">
        Zobacz zdjęcia z naszych wydarzeń.
      </ShinyText>
    </div>
  )
}
