import { ShinyText } from '../components/ui'

export default function Schedule() {
  return (
    <div className="container mx-auto p-8 text-center">
      <ShinyText as="h1" variant="title" className="mb-8 text-4xl">
        Schedule
      </ShinyText>
      <ShinyText as="p" variant="body" className="text-xl">
        Find a class that fits your time.
      </ShinyText>
    </div>
  )
}
